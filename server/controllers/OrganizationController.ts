import express from 'express';
import { Response, Request } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

// DEMO REQUESTS
export const requestDemo = async (req: Request, res: Response) => {
  const { school_name, contact_email } = req.body;
  if (!school_name || !contact_email) {
    return res.status(400).json({ error: 'School name and email are required.' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO organizations (name, email, status, demo_requested) VALUES ($1, $2, 'Demo Request', TRUE) RETURNING id, name, email",
      [school_name, contact_email]
    );
    res.status(201).json({ message: 'Demo request received successfully.', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


// ORGANIZATIONS
export const getOrganization = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT o.*, s.expiry_date, s.status as subscription_status
      FROM organizations o
      LEFT JOIN LATERAL (
          SELECT expiry_date, status
          FROM subscriptions
          WHERE org_id = o.id
          ORDER BY created_at DESC
          LIMIT 1
      ) s ON true
      WHERE o.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT o.*, s.expiry_date, s.status as subscription_status
        FROM organizations o
        LEFT JOIN LATERAL (
            SELECT expiry_date, status
            FROM subscriptions
            WHERE org_id = o.id
            ORDER BY created_at DESC
            LIMIT 1
        ) s ON true
      `);
    } else {
      result = await pool.query(`
        SELECT o.*, s.expiry_date, s.status as subscription_status
        FROM organizations o
        LEFT JOIN LATERAL (
            SELECT expiry_date, status
            FROM subscriptions
            WHERE org_id = o.id
            ORDER BY created_at DESC
            LIMIT 1
        ) s ON true
        WHERE o.id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createOrganization = async (req: AuthRequest, res: Response) => {
  const { name, type, email, contact_number, address, plan, language, timezone, custom_domain, logo_url, logo, signature, default_leave_limit, default_leave_limit_unit } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO organizations (name, type, email, contact_number, address, plan, language, timezone, custom_domain, logo_url, logo, signature, default_leave_limit, default_leave_limit_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [name, type, email, contact_number, address, plan, language, timezone, custom_domain, logo_url, logo, signature, default_leave_limit || 20, default_leave_limit_unit || 'Days']
    );
    await recordAuditLog(req.user.id, 'CREATE_ORGANIZATION', `Created organization: ${name}`, result.rows[0].id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'name', 'type', 'status', 'plan', 'language', 'timezone', 'email', 
    'contact_number', 'address', 'custom_domain', 'logo_url', 'logo', 
    'signature', 'default_leave_limit', 'default_leave_limit_unit', 'gemini_api_key',
    'academic_year', 'current_term', 'admission_no_prefix', 'admission_no_suffix', 'admission_no_start_from', 'currency'
  ];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(req.body[field]);
      paramIndex++;
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    values.push(id);
    const result = await client.query(
      `WITH updated_org AS (
         UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *
       )
       SELECT o.*, s.expiry_date, s.status as subscription_status
       FROM updated_org o
       LEFT JOIN LATERAL (
           SELECT expiry_date, status
           FROM subscriptions
           WHERE org_id = o.id
           ORDER BY created_at DESC
           LIMIT 1
       ) s ON true`,
      values
    );

    if (req.body.plan) {
      await client.query(
        "UPDATE subscriptions SET plan = $1 WHERE org_id = $2 AND status = 'Active'",
        [req.body.plan, id]
      );
    }

    if (req.body.status === 'Inactive') {
      await client.query(
        "UPDATE subscriptions SET status = 'Expired' WHERE org_id = $1 AND status = 'Active'",
        [id]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_ORGANIZATION', `Updated organization ID: ${id}`, id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
export const deleteOrganization = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_ORGANIZATION', `Deleted organization ID: ${id}`, id, req.ip || '');
    res.json({ message: 'Organization deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.currency 
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
      `);
    } else {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.currency 
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
        WHERE s.org_id = $1
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
    } else if (role === 'HOD') {
      // HOD sees logs for staff in their department
      result = await pool.query(`
        SELECT al.* 
        FROM audit_logs al
        JOIN staff s ON al.user_id = s.user_id
        WHERE s.department_id = (SELECT department_id FROM staff WHERE user_id = $1)
        ORDER BY al.created_at DESC 
        LIMIT 150
      `, [req.user.id]);
    } else {
      // School Admin sees logs for their organization
      result = await pool.query(`
        SELECT al.* 
        FROM audit_logs al
        WHERE al.org_id = $1
        ORDER BY al.created_at DESC 
        LIMIT 150
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getModules = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM modules');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateModule = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE modules SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    await recordAuditLog(req.user.id, 'UPDATE_MODULE', `Updated module ID: ${id} to ${status}`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM modules WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_MODULE', `Deleted module ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Module deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// USERS (Platform-wide)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, o.name as org_name 
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PLANS
export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM plan_templates ORDER BY price ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  const { name, price, period, description, modules, is_popular, commission_amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO plan_templates (name, price, period, description, modules, is_popular, commission_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, price, period, description, JSON.stringify(modules), is_popular, commission_amount || 0]
    );
    await recordAuditLog(req.user.id, 'CREATE_PLAN', `Created plan template: ${name}`, req.user.org_id, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, price, period, description, modules, is_popular, commission_amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE plan_templates 
       SET name = $1, price = $2, period = $3, description = $4, modules = $5, is_popular = $6, commission_amount = $7 
       WHERE id = $8 RETURNING *`,
      [name, price, period, description, JSON.stringify(modules), is_popular, commission_amount || 0, id]
    );
    await recordAuditLog(req.user.id, 'UPDATE_PLAN', `Updated plan template ID: ${id}`, req.user.org_id, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM plan_templates WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_PLAN', `Deleted plan template ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Plan deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSubscription = async (req: AuthRequest, res: Response) => {
  const { org_id, plan_name, status, expiry_date, amount, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create subscription record
    const subResult = await client.query(
      'INSERT INTO subscriptions (org_id, plan, status, expiry_date, amount, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [org_id, plan_name, status, expiry_date, amount, payment_method]
    );

    // 2. Update organization's current plan
    await client.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2',
      [plan_name, org_id]
    );

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'CREATE_SUBSCRIPTION', `Created subscription for org ID: ${org_id} (Plan: ${plan_name})`, req.user.org_id, req.ip || '');
    res.status(201).json(subResult.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { plan_name, status, expiry_date, amount, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update subscription
    const subResult = await client.query(
      `UPDATE subscriptions 
       SET plan = $1, status = $2, expiry_date = $3, amount = $4, payment_method = $5 
       WHERE id = $6 RETURNING *`,
      [plan_name, status, expiry_date, amount, payment_method, id]
    );

    // 2. Sync with organization if status is Active
    if (subResult.rows[0] && status === 'Active') {
      await client.query(
        'UPDATE organizations SET plan = $1 WHERE id = $2',
        [plan_name, subResult.rows[0].org_id]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'UPDATE_SUBSCRIPTION', `Updated subscription ID: ${id} (Org ID: ${subResult.rows[0]?.org_id})`, req.user.org_id, req.ip || '');
    res.json(subResult.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteSubscription = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM subscriptions WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_SUBSCRIPTION', `Deleted subscription ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Subscription deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const orgId = req.user.org_id;
    let result;
    if (role === 'SUPER_ADMIN') {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.logo_url, o.address, o.contact_number
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
        WHERE s.status = 'Active' OR s.status = 'Completed'
        ORDER BY s.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT s.*, o.name as org_name, o.logo_url, o.address, o.contact_number
        FROM subscriptions s
        JOIN organizations o ON s.org_id = o.id
        WHERE s.org_id = $1 AND (s.status = 'Active' OR s.status = 'Completed')
        ORDER BY s.created_at DESC
      `, [orgId]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    await recordAuditLog(req.user.id, 'DELETE_USER', `Deleted user account ID: ${id}`, req.user.org_id, req.ip || '');
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getGeminiKeys = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('SELECT * FROM gemini_api_keys WHERE org_id = $1', [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveGeminiKey = async (req: AuthRequest, res: Response) => {
  const { api_key } = req.body;
  const orgId = req.user.org_id;
  try {
    const result = await pool.query(
      `INSERT INTO gemini_api_keys (org_id, api_key) 
       VALUES ($1, $2)
       ON CONFLICT (org_id) 
       DO UPDATE SET api_key = EXCLUDED.api_key
       RETURNING *`,
      [orgId, api_key]
    );
    await recordAuditLog(req.user.id, 'SAVE_GEMINI_KEY', `Saved AI API key for org ID: ${orgId}`, orgId, req.ip || '');
    res.status(200).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyPaystackPayment = async (req: AuthRequest, res: Response) => {
  const { reference, planId } = req.body;
  const orgId = req.user.org_id;
  const userId = req.user.id;

  if (!reference) {
    return res.status(400).json({ error: 'No transaction reference provided' });
  }

  const client = await pool.connect();
  try {
    // 1. Verify with Paystack API
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Paystack verification failed', details: data.message });
    }

    const paymentData = data.data;
    const paidAmount = paymentData.amount / 100; // Paystack sends in pesewas/subunits

    // 2. Begin Database Transaction
    await client.query('BEGIN');

    // Get plan details 
    const planResult = await client.query('SELECT * FROM plan_templates WHERE id = $1', [planId]);
    if (planResult.rows.length === 0) {
      throw new Error('Plan template not found');
    }
    const plan = planResult.rows[0];

    // Calculate new expiry date
    const now = new Date();
    let expiry = new Date();
    if (plan.period === 'monthly') {
      expiry.setMonth(now.getMonth() + 1);
    } else if (plan.period === 'yearly') {
      expiry.setFullYear(now.getFullYear() + 1);
    } else {
      expiry.setMonth(now.getMonth() + 1); // Default to 1 month
    }

    // 3. Create/Update subscription
    const subResult = await client.query(
      `INSERT INTO subscriptions (org_id, plan, status, expiry_date, amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orgId, plan.name, 'Active', expiry.toISOString(), paidAmount, 'Paystack']
    );

    // 4. Update organization's current plan
    await client.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2',
      [plan.name, orgId]
    );

    await client.query('COMMIT');

    await recordAuditLog(userId, 'PAYSTACK_RENEWAL', `Paystack subscription renewal successful. Ref: ${reference}`, orgId, req.ip || '');

    res.json({
      success: true,
      message: 'Subscription renewed successfully!',
      subscription: subResult.rows[0]
    });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Paystack Verification Error]:', err);
    res.status(500).json({ error: 'Failed to verify payment and update subscription', details: err.message });
  } finally {
    client.release();
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { password: rawPassword } = req.body;
  
  const password = rawPassword || 'zxcv123$$';

  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await recordAuditLog(req.user.id, 'RESET_PASSWORD', `Reset password for user: ${result.rows[0].email}`, req.user.org_id, req.ip || '');
    res.json({ message: 'Password reset successfully.', user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
