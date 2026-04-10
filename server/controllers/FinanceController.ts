import express from 'express';
import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

const parseAmount = (val: any) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const sanitized = val.replace(/,/g, '').replace(/[^-0-9.]/g, '');
    return parseFloat(sanitized) || 0;
  }
  return 0;
};

// FEE STRUCTURES
export const getFeeStructures = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;

    // Schema migration: ensure class_ids column exists
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fee_structures' AND column_name='class_ids') THEN
          ALTER TABLE fee_structures ADD COLUMN class_ids UUID[];
        END IF;
      END $$;
    `);

    let query = `
      SELECT 
        fs.*,
        (SELECT JSON_AGG(json_build_object('id', c.id, 'name', c.name))
         FROM classes c 
         WHERE c.id = fs.class_id OR c.id = ANY(fs.class_ids)) as assigned_classes,
        (SELECT COUNT(*) 
         FROM invoices i 
         WHERE i.description = fs.name AND i.org_id = fs.org_id) as assignment_count
      FROM fee_structures fs
      WHERE 1=1
    `;
    let params: any[] = [];
    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND fs.org_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createFeeStructure = async (req: AuthRequest, res: Response) => {
  const { name, amount, period, class_id, target_type, student_ids, due_date } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    let classIds = req.body.class_ids;
    if (typeof classIds === 'string' && classIds) classIds = classIds.split(',');

    // 1. Create the template
    const result = await client.query(
      'INSERT INTO fee_structures (org_id, name, amount, period, class_id, class_ids) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgId, name, parseAmount(amount), period, class_id || null, classIds || null]
    );
    const feeStructure = result.rows[0];

    // 2. Handle Instant Assignment
    if (target_type === 'class' && (class_id || req.body.class_ids)) {
      let classIds = req.body.class_ids || [class_id];
      if (typeof classIds === 'string') classIds = classIds.split(',');
      const studentsResult = await client.query('SELECT id FROM students WHERE class_id = ANY($1) AND org_id = $2', [classIds, orgId]);
      for (const student of studentsResult.rows) {
        await client.query(
          'INSERT INTO invoices (org_id, student_id, amount, due_date, description) VALUES ($1, $2, $3, $4, $5)',
          [orgId, student.id, amount, due_date, name]
        );
      }
    } else if (target_type === 'students' && Array.isArray(student_ids)) {
      for (const studentId of student_ids) {
        await client.query(
          'INSERT INTO invoices (org_id, student_id, amount, due_date, description) VALUES ($1, $2, $3, $4, $5)',
          [orgId, studentId, amount, due_date, name]
        );
      }
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_FEE_STRUCTURE', `Created fee structure: ${name} (${amount})`, req.user.org_id);
    res.status(201).json(feeStructure);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// INVOICES
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    const { studentId } = req.query;
    let query = `
      SELECT 
        i.*, 
        s.name as student_name,
        s.admission_no as student_admission_no,
        c.name as student_class,
        i.description as invoice_description,
        p.method as payment_method,
        p.amount as paid_amount,
        p.date as payment_date
      FROM invoices i 
      JOIN students s ON i.student_id = s.id 
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN payments p ON i.id = p.invoice_id
      WHERE 1=1
    `;
    let params: any[] = [];
    
    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND i.org_id = $${params.length}`;
    }

    if (studentId) {
      params.push(studentId);
      query += ` AND i.student_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
    const { student_id, amount, due_date, status, description, term, academic_year } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orgId = req.user.org_id;
      const result = await client.query(
        'INSERT INTO invoices (org_id, student_id, amount, due_date, status, description, term, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [orgId, student_id, amount, due_date, status || 'Pending', description || null, term || null, academic_year || null]
      );
    const invoice = result.rows[0];

    // If marked as Paid immediately, record a payment entry
    if (status === 'Paid') {
      await recordAutomaticPayment(client, orgId, invoice.id, student_id, amount);
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_INVOICE', `Created invoice for student ID: ${student_id} (${amount})`, req.user.org_id);
    res.status(201).json(invoice);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Helper to record payment when invoice is marked paid
const recordAutomaticPayment = async (client: any, orgId: string, invoiceId: string, studentId: string, amount: number, method: string = 'Cash', reference: string = '') => {
  // Try to get term/academic_year from invoice
  const invResult = await client.query('SELECT term, academic_year FROM invoices WHERE id = $1', [invoiceId]);
  const term = invResult.rows[0]?.term;
  const ay = invResult.rows[0]?.academic_year;

  await client.query(
    'INSERT INTO payments (org_id, invoice_id, student_id, amount, method, transaction_id, term, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [orgId, invoiceId, studentId, amount, method, reference || `AUTO-${Date.now()}`, term || null, ay || null]
  );
};

// PAYMENTS
export const processPayment = async (req: AuthRequest, res: Response) => {
  const { invoice_id, student_id, amount, payment_method, transaction_id, term, academic_year } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Record payment
    const paymentResult = await client.query(
      'INSERT INTO payments (org_id, invoice_id, student_id, amount, method, transaction_id, term, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [orgId, invoice_id || null, student_id, amount, payment_method, transaction_id, term || null, academic_year || null]
    );

    // 2. Update invoice status (if invoice_id is provided)
    if (invoice_id) {
      // Check if fully paid
      const sumResult = await client.query('SELECT SUM(amount) as paid_total FROM payments WHERE invoice_id = $1', [invoice_id]);
      const paidTotal = parseFloat(sumResult.rows[0].paid_total || 0);
      
      const invResult = await client.query('SELECT amount FROM invoices WHERE id = $1', [invoice_id]);
      const invAmount = parseFloat(invResult.rows[0].amount || 0);

      if (paidTotal >= invAmount) {
        await client.query(
          "UPDATE invoices SET status = 'Paid' WHERE id = $1",
          [invoice_id]
        );
      }
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'PROCESS_PAYMENT', `Processed payment for student ID: ${student_id} (${amount})`, req.user.org_id);
    res.status(201).json(paymentResult.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT p.*, s.name as student_name, c.name as class_name
        FROM payments p
        JOIN students s ON p.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        ORDER BY p.date DESC
      `);
    } else {
      result = await pool.query(`
        SELECT p.*, s.name as student_name, c.name as class_name
        FROM payments p
        JOIN students s ON p.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE p.org_id = $1
        ORDER BY p.date DESC
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePayment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, date, method, transaction_id, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE payments SET amount = $1, date = $2, method = $3, transaction_id = $4, status = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [amount, date, method, transaction_id, status, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    await recordAuditLog(req.user.id, 'UPDATE_PAYMENT', `Updated payment ID: ${id} (${status})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM payments WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    await recordAuditLog(req.user.id, 'DELETE_PAYMENT', `Deleted payment ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Payment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// EXPENSES
export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM expenses');
    } else {
      result = await pool.query('SELECT * FROM expenses WHERE org_id = $1', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  const { category, amount, date, description } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO expenses (org_id, category, amount, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, category, amount, date, description]
    );
    await recordAuditLog(req.user.id, 'CREATE_EXPENSE', `Created expense: ${category} (${amount})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// SCHOLARSHIP TYPES
export const getScholarshipTypes = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;

    // Initialize table if it doesn't exist (safety)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scholarship_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        name TEXT NOT NULL,
        amount DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM scholarship_types');
    } else {
      result = await pool.query('SELECT * FROM scholarship_types WHERE org_id = $1', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createScholarshipType = async (req: AuthRequest, res: Response) => {
  const { name, amount } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO scholarship_types (org_id, name, amount) VALUES ($1, $2, $3) RETURNING *',
      [orgId, name, parseAmount(amount)]
    );
    await recordAuditLog(req.user.id, 'CREATE_SCHOLARSHIP_TYPE', `Created scholarship type: ${name} (${amount})`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateScholarshipType = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, amount } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE scholarship_types SET name = $1, amount = $2 WHERE id = $3 AND org_id = $4 RETURNING *',
      [name, parseAmount(amount), id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scholarship type not found' });
    await recordAuditLog(req.user.id, 'UPDATE_SCHOLARSHIP_TYPE', `Updated scholarship type ID: ${id} (${name})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteScholarshipType = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM scholarship_types WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scholarship type not found' });
    await recordAuditLog(req.user.id, 'DELETE_SCHOLARSHIP_TYPE', `Deleted scholarship type ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Scholarship type deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// SCHOLARSHIPS
export const getScholarships = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;

    // Ensure status and type_id columns exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scholarships' AND column_name='status') THEN
          ALTER TABLE scholarships ADD COLUMN status TEXT DEFAULT 'Active';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scholarships' AND column_name='type_id') THEN
          ALTER TABLE scholarships ADD COLUMN type_id UUID;
        END IF;
      END $$;
    `);

    let result;
    const query = `
      SELECT s.*, st.name as student_name, ty.name as type_name, ty.amount as type_amount
      FROM scholarships s
      JOIN students st ON s.student_id = st.id
      LEFT JOIN scholarship_types ty ON s.type_id = ty.id
      WHERE ${role === 'SUPER_ADMIN' ? '1=1' : 's.org_id = $1'}
    `;
    
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(query);
    } else {
      result = await pool.query(query, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createScholarship = async (req: AuthRequest, res: Response) => {
  const { student_id, type_id, amount, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO scholarships (org_id, student_id, type_id, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orgId, student_id, type_id, parseAmount(amount), status || 'Active']
    );
    await recordAuditLog(req.user.id, 'CREATE_SCHOLARSHIP', `Created scholarship for student ID: ${student_id}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateFeeStructure = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, amount, period, class_id } = req.body;
  try {
    const orgId = req.user.org_id;
    let classIds = req.body.class_ids;
    if (typeof classIds === 'string' && classIds) classIds = classIds.split(',');

    const result = await pool.query(
      'UPDATE fee_structures SET name = $1, amount = $2, period = $3, class_id = $4, class_ids = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [name, parseAmount(amount), period, class_id || null, classIds || null, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fee structure not found' });
    await recordAuditLog(req.user.id, 'UPDATE_FEE_STRUCTURE', `Updated fee structure ID: ${id} (${name})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFeeStructure = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM fee_structures WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fee structure not found' });
    await recordAuditLog(req.user.id, 'DELETE_FEE_STRUCTURE', `Deleted fee structure ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Fee structure deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
    const { amount, due_date, status, description, term, academic_year } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orgId = req.user.org_id;
  
      // Check old status
      const oldResult = await client.query('SELECT status, student_id, amount FROM invoices WHERE id = $1 AND org_id = $2', [id, orgId]);
      if (oldResult.rows.length === 0) throw new Error('Invoice not found');
      const oldInvoice = oldResult.rows[0];
  
      const result = await client.query(
        'UPDATE invoices SET amount = $1, due_date = $2, status = $3, description = $4, term = $5, academic_year = $6 WHERE id = $7 AND org_id = $8 RETURNING *',
        [amount, due_date, status, description, term || null, academic_year || null, id, orgId]
      );
    const updatedInvoice = result.rows[0];

    // If status changed to Paid, record a payment entry
    if (oldInvoice.status !== 'Paid' && status === 'Paid') {
      // Check if there's already payments that sum up to this amount
      const paymentsSum = await client.query('SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = $1', [id]);
      const alreadyPaid = parseFloat(paymentsSum.rows[0].paid);
      
      if (alreadyPaid < amount) {
        const paymentMethod = req.body.payment_method || 'Cash';
        const paymentRef = req.body.payment_reference || '';
        await recordAutomaticPayment(client, orgId, id, oldInvoice.student_id, amount - alreadyPaid, paymentMethod, paymentRef);
      }
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_INVOICE', `Updated invoice ID: ${id} (${status})`, orgId, req.ip || '');
    res.json(updatedInvoice);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    await recordAuditLog(req.user.id, 'DELETE_INVOICE', `Deleted invoice ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { category, amount, date, description } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE expenses SET category = $1, amount = $2, date = $3, description = $4 WHERE id = $5 AND org_id = $6 RETURNING *',
      [category, amount, date, description, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    await recordAuditLog(req.user.id, 'UPDATE_EXPENSE', `Updated expense ID: ${id} (${category})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    await recordAuditLog(req.user.id, 'DELETE_EXPENSE', `Deleted expense ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Expense deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateScholarship = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type_id, amount, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE scholarships SET type_id = $1, amount = $2, status = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [type_id, parseAmount(amount), status, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scholarship not found' });
    await recordAuditLog(req.user.id, 'UPDATE_SCHOLARSHIP', `Updated scholarship ID: ${id} (${status})`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteScholarship = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM scholarships WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scholarship not found' });
    await recordAuditLog(req.user.id, 'DELETE_SCHOLARSHIP', `Deleted scholarship ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Scholarship deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const assignFee = async (req: AuthRequest, res: Response) => {
    const { student_id, fee_structure_id, due_date, target_type, class_id, status, payment_method, transaction_id, term, academic_year } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orgId = req.user.org_id;
  
      // 1. Get fee details
      const final_fee_id = Array.isArray(fee_structure_id) ? fee_structure_id[0] : fee_structure_id;
      const feeResult = await client.query('SELECT name, amount, class_id, class_ids FROM fee_structures WHERE id = $1', [final_fee_id]);
      if (feeResult.rows.length === 0) throw new Error('Fee structure not found');
      const { name, amount, class_id: feeClassId, class_ids: feeClassIds } = feeResult.rows[0];
  
      if (target_type === 'students' && student_id) {
        const invResult = await client.query(
          'INSERT INTO invoices (org_id, student_id, amount, due_date, description, status, term, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [orgId, student_id, amount, due_date, name, status || 'Pending', term || null, academic_year || null]
        );
        
        if (status === 'Paid') {
          await recordAutomaticPayment(client, orgId, invResult.rows[0].id, student_id, amount, payment_method || 'Cash', transaction_id);
        }
      } else if (target_type === 'class') {
        let classIds = req.body.class_ids || (class_id ? [class_id] : []);
        
        // If no class IDs provided, use the ones pre-assigned to the fee structure
        if ((!classIds || classIds.length === 0) && (feeClassId || feeClassIds)) {
          classIds = feeClassIds || [feeClassId];
        }
  
        if (!classIds || classIds.length === 0) {
          throw new Error(`No classes selected or pre-assigned for fee: ${name}`);
        }
  
        if (typeof classIds === 'string') classIds = classIds.split(',');
        
        const studentsResult = await client.query('SELECT id FROM students WHERE class_id = ANY($1) AND org_id = $2', [classIds, orgId]);
        for (const student of studentsResult.rows) {
          const invResult = await client.query(
            'INSERT INTO invoices (org_id, student_id, amount, due_date, description, status, term, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [orgId, student.id, amount, due_date, name, status || 'Pending', term || null, academic_year || null]
          );
  
          if (status === 'Paid') {
            await recordAutomaticPayment(client, orgId, invResult.rows[0].id, student.id, amount, payment_method || 'Cash', transaction_id);
          }
        }
      }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'ASSIGN_FEE', `Assigned fee to ${target_type}: ${name}`, req.user.org_id);
    res.status(201).json({ message: 'Fee assigned successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getStudentFeesSummary = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = `
      SELECT 
        s.id, 
        s.name, 
        c.name as class_name,
        (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE student_id = s.id) as total_invoiced,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = s.id) as total_paid,
        (SELECT COALESCE(SUM(amount), 0) FROM scholarships WHERE student_id = s.id AND status = 'Active') as total_scholarships,
        (
          COALESCE((SELECT SUM(amount) FROM invoices WHERE student_id = s.id), 0) - 
          COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id), 0) -
          COALESCE((SELECT SUM(amount) FROM scholarships WHERE student_id = s.id AND status = 'Active'), 0)
        ) as outstanding_amount
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    let params: any[] = [];
    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND s.org_id = $${params.length}`;
    }
    query += ` GROUP BY s.id, s.name, c.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
