import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

// CLUBS
export const getClubs = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `SELECT c.*, COUNT(cm.id) as member_count 
       FROM clubs c 
       LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.status = 'Active'
       WHERE c.org_id = $1 
       GROUP BY c.id 
       ORDER BY c.created_at DESC`,
      [orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createClub = async (req: AuthRequest, res: Response) => {
  const { name, description, category, meeting_schedule, patron_staff_id, dues_amount, dues_frequency, max_members } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `INSERT INTO clubs (org_id, name, description, category, meeting_schedule, patron_staff_id, dues_amount, dues_frequency, max_members) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [orgId, name, description, category, meeting_schedule, patron_staff_id, dues_amount || 0, dues_frequency || 'Per Term', max_members]
    );
    await recordAuditLog(req.user.id, 'CREATE_CLUB', `Created club: ${name}`, orgId, req.ip || '');
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateClub = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, category, meeting_schedule, patron_staff_id, dues_amount, dues_frequency, max_members, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `UPDATE clubs SET name = $1, description = $2, category = $3, meeting_schedule = $4, patron_staff_id = $5, 
       dues_amount = $6, dues_frequency = $7, max_members = $8, status = $9 
       WHERE id = $10 AND org_id = $11 RETURNING *`,
      [name, description, category, meeting_schedule, patron_staff_id, dues_amount, dues_frequency, max_members, status, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Club not found' });
    await recordAuditLog(req.user.id, 'UPDATE_CLUB', `Updated club ID: ${id}`, orgId, req.ip || '');
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteClub = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM clubs WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Club not found' });
    await recordAuditLog(req.user.id, 'DELETE_CLUB', `Deleted club ID: ${id}`, orgId, req.ip || '');
    res.json({ message: 'Club deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// CLUB MEMBERSHIPS
export const getClubMemberships = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `SELECT cm.*, s.name as student_name, c.name as club_name, c.dues_amount, c.dues_frequency
       FROM club_memberships cm
       JOIN clubs c ON cm.club_id = c.id
       JOIN students s ON cm.student_id = s.id
       WHERE c.org_id = $1
       ORDER BY cm.joined_at DESC`,
      [orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const joinClub = async (req: AuthRequest, res: Response) => {
  const { club_id, student_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Check if club exists and get dues
    const clubResult = await client.query('SELECT * FROM clubs WHERE id = $1 AND org_id = $2', [club_id, orgId]);
    if (clubResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Club not found' });
    }
    const club = clubResult.rows[0];

    // 2. Create membership (status is Active by default for direct admin add, or Pending for student request)
    const status = req.user.role === 'SCHOOL_ADMIN' || req.user.role === 'SUPER_ADMIN' ? 'Active' : 'Pending';
    const membershipResult = await client.query(
      `INSERT INTO club_memberships (club_id, student_id, status) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (club_id, student_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING *`,
      [club_id, student_id, status]
    );

    // 3. If Active and has dues, create invoice automatically
    if (status === 'Active' && club.dues_amount > 0) {
      const description = `Club Dues: ${club.name} (${club.dues_frequency || 'Per Term'})`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, student_id, club.dues_amount, description]
      );
    }

    await client.query('COMMIT');
    await recordAuditLog(req.user.id, 'JOIN_CLUB', `Student ${student_id} joined club ${club_id}`, orgId, req.ip || '');
    res.status(201).json(membershipResult.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateMembershipStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgId = req.user.org_id;

    // 1. Get old membership info and club dues
    const membershipRes = await client.query(
      `SELECT cm.*, c.name as club_name, c.dues_amount, c.dues_frequency 
       FROM club_memberships cm 
       JOIN clubs c ON cm.club_id = c.id 
       WHERE cm.id = $1 AND c.org_id = $2`,
      [id, orgId]
    );
    
    if (membershipRes.rows.length === 0) throw new Error('Membership not found');
    const membership = membershipRes.rows[0];

    // 2. Update status
    const result = await client.query(
      `UPDATE club_memberships SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // 3. Create invoice if status became Active and has dues
    if (membership.status !== 'Active' && status === 'Active' && membership.dues_amount > 0) {
      const description = `Club Dues: ${membership.club_name} (${membership.dues_frequency || 'Per Term'})`;
      await client.query(
        "INSERT INTO invoices (org_id, student_id, amount, due_date, status, description) VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'Pending', $4)",
        [orgId, membership.student_id, membership.dues_amount, description]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const leaveClub = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `DELETE FROM club_memberships cm
       USING clubs c
       WHERE cm.id = $1 AND cm.club_id = c.id AND c.org_id = $2
       RETURNING cm.*`,
      [id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membership not found' });
    res.json({ message: 'Left club successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
