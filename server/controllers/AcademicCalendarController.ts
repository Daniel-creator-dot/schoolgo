import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user.org_id;
    const result = await pool.query(
      'SELECT * FROM academic_calendar WHERE org_id = $1 ORDER BY start_date ASC',
      [org_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  const { event_name, event_description, start_date, end_date, event_type } = req.body;
  try {
    const org_id = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO academic_calendar (event_name, event_description, start_date, end_date, event_type, org_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event_name, event_description, start_date, end_date || null, event_type, org_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { event_name, event_description, start_date, end_date, event_type } = req.body;
  try {
    const org_id = req.user.org_id;
    const result = await pool.query(
      'UPDATE academic_calendar SET event_name = $1, event_description = $2, start_date = $3, end_date = $4, event_type = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [event_name, event_description, start_date, end_date || null, event_type, id, org_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const org_id = req.user.org_id;
    const result = await pool.query(
      'DELETE FROM academic_calendar WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, org_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
