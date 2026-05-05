import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// GET all whistleblower reports (School Admin only)
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `SELECT * FROM whistleblower_reports WHERE org_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('getWhistleblowerReports error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST a new anonymous report (Staff)
export const createReport = async (req: AuthRequest, res: Response) => {
  const { title, description, category, urgency } = req.body;
  try {
    const orgId = req.user.org_id;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    // IMPORTANT: We intentionally do NOT store req.user.id or any staff identifier
    const result = await pool.query(
      `INSERT INTO whistleblower_reports (org_id, title, description, category, urgency)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orgId, title, description, category || 'General', urgency || 'Medium']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('createWhistleblowerReport error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH update report status (School Admin only)
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `UPDATE whistleblower_reports SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
      [status, id, orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('updateWhistleblowerReport error:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE a report (School Admin only)
export const deleteReport = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `DELETE FROM whistleblower_reports WHERE id = $1 AND org_id = $2 RETURNING *`,
      [id, orgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json({ message: 'Report deleted successfully.' });
  } catch (err: any) {
    console.error('deleteWhistleblowerReport error:', err);
    res.status(500).json({ error: err.message });
  }
};
