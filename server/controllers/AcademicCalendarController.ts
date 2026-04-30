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

export const syncPublicHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user.org_id;
    const { year } = req.body;
    const targetYear = year || new Date().getFullYear();

    // Get country code
    const orgResult = await pool.query('SELECT country_code FROM organizations WHERE id = $1', [org_id]);
    const countryCode = orgResult.rows[0]?.country_code;

    if (!countryCode) {
      return res.status(400).json({ error: 'Please configure your Country in the organization settings first.' });
    }

    // Fetch from Nager.Date API
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${targetYear}/${countryCode}`);
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch public holidays from external provider.' });
    }

    const holidays = await response.json();
    let syncedCount = 0;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const h of holidays) {
        // Check if already exists to avoid duplicates
        const existing = await client.query(
          'SELECT id FROM academic_calendar WHERE org_id = $1 AND start_date = $2 AND event_name = $3',
          [org_id, h.date, `Public Holiday: ${h.name}`]
        );

        if (existing.rows.length === 0) {
          await client.query(
            'INSERT INTO academic_calendar (event_name, event_description, start_date, end_date, event_type, org_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [`Public Holiday: ${h.name}`, `${h.localName} - Synced automatically`, h.date, h.date, 'Holiday', org_id]
          );
          syncedCount++;
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ message: `Successfully synced ${syncedCount} new public holidays.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
