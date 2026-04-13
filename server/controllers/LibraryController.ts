import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads/books');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// BOOKS
export const getBooks = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT id, org_id, title, author, isbn, category, total_copies, available_copies, is_digital, digital_url, price, created_at FROM books ORDER BY created_at DESC');
    } else {
      result = await pool.query('SELECT id, org_id, title, author, isbn, category, total_copies, available_copies, is_digital, digital_url, price, created_at FROM books WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createBook = async (req: AuthRequest, res: Response) => {
  let { title, author, isbn, category, total_copies, is_digital, digital_url, price } = req.body;
  try {
    const orgId = req.user.org_id;
    let digitalContent: Buffer | null = null;
    
    // Handle Base64 PDF storage
    if (is_digital && digital_url && digital_url.startsWith('data:application/pdf;base64,')) {
      const base64Data = digital_url.split(';base64,').pop();
      digitalContent = Buffer.from(base64Data!, 'base64');
      digital_url = 'DATABASE_BLOB'; // Marker
    }

    const result = await pool.query(
      'INSERT INTO books (org_id, title, author, isbn, category, total_copies, available_copies, is_digital, digital_url, digital_content, price) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10) RETURNING *',
      [orgId, title, author, isbn, category, total_copies, is_digital || false, digital_url || null, digitalContent, price || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBook = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  let { title, author, isbn, category, total_copies, available_copies, is_digital, digital_url, price } = req.body;
  try {
    const orgId = req.user.org_id;
    let digitalContent: Buffer | null = null;
    let queryFields = 'title = $1, author = $2, isbn = $3, category = $4, total_copies = $5, available_copies = $6, is_digital = $7, price = $8';
    let params: any[] = [title, author, isbn, category, total_copies, available_copies, is_digital, price || 0];

    // Handle Base64 PDF upload on update
    if (is_digital && digital_url && digital_url.startsWith('data:application/pdf;base64,')) {
      const base64Data = digital_url.split(';base64,').pop();
      digitalContent = Buffer.from(base64Data!, 'base64');
      digital_url = 'DATABASE_BLOB';
      queryFields += ', digital_url = $9, digital_content = $10';
      params.push(digital_url, digitalContent);
    } else {
      queryFields += ', digital_url = $9';
      params.push(digital_url);
    }

    params.push(id, orgId);
    const result = await pool.query(
      `UPDATE books SET ${queryFields} WHERE id = $${params.length - 1} AND org_id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookContent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'SELECT digital_content, title FROM books WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );

    if (result.rows.length === 0 || !result.rows[0].digital_content) {
      return res.status(404).json({ error: 'Book content not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.rows[0].title}.pdf"`);
    res.send(result.rows[0].digital_content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBook = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM books WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// LOANS
export const getBookLoans = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const orgId = req.user.org_id;
    const { role } = req.user;
    
    let query = `
      SELECT 
        bl.*, 
        b.title as book_title, 
        COALESCE(s.name, st.name) as borrower_name,
        COALESCE(s.name, st.name) as user_name
      FROM book_loans bl 
      JOIN books b ON bl.book_id = b.id 
      LEFT JOIN students s ON bl.student_id = s.id
      LEFT JOIN staff st ON bl.staff_id = st.id`;
    const params: any[] = [];

    if (role === 'STUDENT') {
      // Need student ID. If we don't have a shared user_id, 
      // we might need to find the student record by email or similar if it's not in req.user.
      // Assuming for now students borrow through the librarian mostly, 
      // but if they view their own:
      params.push(userId); 
      // This is a bit tricky if userId is from 'users' table but we need it to match 'students' or 'staff'.
      // For now, let's just filter by org if it's a librarian/admin, and if it's a student/staff viewing their own, 
      // we'd need a better mapping. 
      // Let's assume the user.id in req.user *is* the mapping if they are logged in.
      query += ` WHERE (bl.student_id = $1 OR bl.staff_id = $1)`;
    } else if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` WHERE b.org_id = $1`;
    }
    
    query += ` ORDER BY bl.loan_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const issueBook = async (req: AuthRequest, res: Response) => {
  const { book_id, user_id, student_id, staff_id, due_date, issue_date } = req.body;
  const target_student_id = student_id || user_id; // Support both for compatibility
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check availability
    const bookResult = await client.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
    if (bookResult.rows.length === 0) throw new Error('Book not found');
    if (bookResult.rows[0].available_copies <= 0) {
      throw new Error('No copies available');
    }

    // Update availability
    await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);

    // Create loan record
    const result = await client.query(
      'INSERT INTO book_loans (book_id, student_id, staff_id, loan_date, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [book_id, target_student_id, staff_id, issue_date || new Date().toISOString().split('T')[0], due_date]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const returnBook = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update loan record
    const loanResult = await client.query(
      "UPDATE book_loans SET return_date = CURRENT_DATE, status = 'Returned' WHERE id = $1 RETURNING book_id",
      [id]
    );
    if (loanResult.rows.length === 0) throw new Error('Loan record not found');

    // Update book availability
    await client.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [loanResult.rows[0].book_id]);

    await client.query('COMMIT');
    res.json({ message: 'Book returned successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const markBookAsLost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Get loan and book details
    const loanResult = await client.query(`
      SELECT bl.*, b.title, b.price, b.org_id
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      WHERE bl.id = $1 AND b.org_id = $2
    `, [id, orgId]);

    if (loanResult.rows.length === 0) throw new Error('Loan record not found');
    const loan = loanResult.rows[0];

    if (loan.status === 'Lost') throw new Error('Book is already marked as lost');

    // 2. Update loan status to 'Lost'
    await client.query("UPDATE book_loans SET status = 'Lost' WHERE id = $1", [id]);

    // 3. Create an invoice for the student (if it's a student)
    if (loan.student_id) {
      const description = `Missing Book: ${loan.title}`;
      const amount = loan.price || 0;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

      await client.query(
        'INSERT INTO invoices (org_id, student_id, amount, due_date, description) VALUES ($1, $2, $3, $4, $5)',
        [orgId, loan.student_id, amount, dueDate, description]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Book marked as lost and invoice generated' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
