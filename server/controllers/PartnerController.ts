import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export const register = async (req: express.Request, res: express.Response) => {
  const { name, email, password, contact_number, company_name, registration_number } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a simple 6-character referral code
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await pool.query(
      'INSERT INTO partners (name, email, password, contact_number, company_name, registration_number, referral_code, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, referral_code, company_name, registration_number, status',
      [name, email, hashedPassword, contact_number, company_name, registration_number, referralCode, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.constraint === 'partners_email_key') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM partners WHERE email = $1', [email]);
    const partner = result.rows[0];

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Reject login if partner hasn't been approved yet
    if (partner.status && partner.status !== 'Active') {
      return res.status(403).json({ message: 'Your partner account is pending approval. Please contact the administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: partner.id, role: 'PARTNER', email: partner.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: partner.id,
        role: 'PARTNER',
        name: partner.name,
        email: partner.email,
        company_name: partner.company_name,
        registration_number: partner.registration_number,
        referral_code: partner.referral_code,
        total_earnings: partner.total_earnings
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = req.user.id;

    const partnerResult = await pool.query('SELECT id, name, email, referral_code, total_earnings FROM partners WHERE id = $1', [partnerId]);
    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const schoolsResult = await pool.query(
        'SELECT id, name, type, status, plan, email, contact_number, address, custom_domain, language, timezone, created_at FROM organizations WHERE referred_by_partner_id = $1', 
        [partnerId]
    );

    res.json({
      partner: partnerResult.rows[0],
      schools: schoolsResult.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSchool = async (req: AuthRequest, res: Response) => {
  const { name, type, email, contact_number, admin_email, admin_password, plan, demo_requested, address, custom_domain, logo, signature, language, timezone } = req.body;
  const partnerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Organization with Pending status and extended fields
    const orgResult = await client.query(
      `INSERT INTO organizations (name, type, email, contact_number, referred_by_partner_id, plan, status, demo_requested, address, custom_domain, logo, signature, language, timezone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [name, type, email, contact_number, partnerId, plan || 'Free', 'Pending', demo_requested || false, address || '', custom_domain || '', logo || '', signature || '', language || 'en', timezone || 'GMT']
    );
    const newOrg = orgResult.rows[0];

    // 2. Create Default Admin User
    const fallbackAdminEmail = admin_email || email;
    const fallbackPassword = admin_password || 'admin123';
    
    if (!fallbackAdminEmail) {
       throw new Error('An administrator email is required to create a school.');
    }

    const hashedPassword = await bcrypt.hash(fallbackPassword, 10);
    await client.query(
      'INSERT INTO users (email, password, name, role, org_id) VALUES ($1, $2, $3, $4, $5)',
      [fallbackAdminEmail, hashedPassword, 'School Admin', 'SCHOOL_ADMIN', newOrg.id]
    );

    await client.query('COMMIT');
    res.status(201).json(newOrg);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const approveReferral = async (req: AuthRequest, res: Response) => {
  const { org_id } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgResult = await client.query(
      'SELECT referred_by_partner_id, status FROM organizations WHERE id = $1',
      [org_id]
    );
    
    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = orgResult.rows[0];
    if (org.status !== 'Pending') {
      return res.status(400).json({ error: 'Organization is not in pending status' });
    }

    await client.query(
      'UPDATE organizations SET status = $1 WHERE id = $2',
      ['Active', org_id]
    );

    if (org.referred_by_partner_id) {
        const commission = 50000;
        await client.query(
            'UPDATE partners SET total_earnings = total_earnings + $1 WHERE id = $2',
            [commission, org.referred_by_partner_id]
        );
    }

    await client.query('COMMIT');
    res.json({ message: 'Referral approved and organization activated' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ===== SUPER ADMIN PARTNER MANAGEMENT =====

export const getAllPartners = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, contact_number, company_name, registration_number, referral_code, total_earnings, status, created_at FROM partners ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPartner = async (req: AuthRequest, res: Response) => {
  const { name, email, password, contact_number, company_name, registration_number, status } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password || 'partner123', 10);
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await pool.query(
      'INSERT INTO partners (name, email, password, contact_number, company_name, registration_number, referral_code, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, contact_number, company_name, registration_number, referral_code, total_earnings, status, created_at',
      [name, email, hashedPassword, contact_number || '', company_name || '', registration_number || '', referralCode, status || 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.constraint === 'partners_email_key') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updatePartner = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, contact_number, company_name, registration_number, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE partners SET name = COALESCE($1, name), email = COALESCE($2, email), contact_number = COALESCE($3, contact_number), company_name = COALESCE($4, company_name), registration_number = COALESCE($5, registration_number), status = COALESCE($6, status) WHERE id = $7 RETURNING id, name, email, contact_number, company_name, registration_number, referral_code, total_earnings, status, created_at',
      [name, email, contact_number, company_name, registration_number, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePartner = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM partners WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Partner deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approvePartner = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE partners SET status = 'Active' WHERE id = $1 RETURNING id, name, email, status",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPartnerPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const hashedPassword = await bcrypt.hash('partner123', 10);
    const result = await pool.query(
      'UPDATE partners SET password = $1 WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Password reset to default (partner123)', partner: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
