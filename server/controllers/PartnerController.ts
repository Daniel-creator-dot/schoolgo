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
      'INSERT INTO partners (name, email, password, contact_number, company_name, registration_number, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, referral_code, company_name, registration_number',
      [name, email, hashedPassword, contact_number, company_name, registration_number, referralCode]
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

    const schoolsResult = await pool.query('SELECT id, name, type, status, plan, created_at FROM organizations WHERE referred_by_partner_id = $1', [partnerId]);

    res.json({
      partner: partnerResult.rows[0],
      schools: schoolsResult.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSchool = async (req: AuthRequest, res: Response) => {
  const { name, type, email, contact_number, admin_email, admin_password, plan, demo_requested } = req.body;
  const partnerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Organization with Pending status
    const orgResult = await client.query(
      'INSERT INTO organizations (name, type, email, contact_number, referred_by_partner_id, plan, status, demo_requested) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, type, email, contact_number, partnerId, plan || 'Free', 'Pending', demo_requested || false]
    );
    const newOrg = orgResult.rows[0];

    // 2. Create Default Admin User
    const hashedPassword = await bcrypt.hash(admin_password || 'admin123', 10);
    await client.query(
      'INSERT INTO users (email, password, name, role, org_id) VALUES ($1, $2, $3, $4, $5)',
      [admin_email, hashedPassword, 'School Admin', 'SCHOOL_ADMIN', newOrg.id]
    );

    // Earnings are only finalized when the school is approved by Super Admin, 
    // but we can log them as 'Pending' if we had a transactions table.
    // For now, we'll keep the dashboard simple and only update total_earnings on activation.

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

    // 1. Get Organization details
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

    // 2. Update status to Active
    await client.query(
      'UPDATE organizations SET status = $1 WHERE id = $2',
      ['Active', org_id]
    );

    // 3. Update Partner earnings if a partner referred them
    if (org.referred_by_partner_id) {
        // Commission: Let's say ₦50,000 flat per activation for this example
        // In a real app, this would be based on the chosen plan
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
