import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const org_id = req.user.org_id;
    const role = req.user.role;
    const user_id = req.user.id;

    let userClassId: string | null = null;
    if (role === 'STUDENT') {
      const student = await pool.query('SELECT class_id FROM students WHERE id = $1', [user_id]);
      if (student.rows.length) userClassId = student.rows[0].class_id;
    }

    let query = `
      SELECT m.*, u.name as creator_name, c.name as class_name
      FROM meetings m
      LEFT JOIN users u ON m.creator_id = u.id
      LEFT JOIN classes c ON m.class_id = c.id
      WHERE m.org_id = $1
    `;
    const params: any[] = [org_id];

    if (role !== 'SCHOOL_ADMIN' && role !== 'SUPER_ADMIN') {
      if (role === 'STUDENT') {
        query += ` AND (
          m.target_audience = 'ALL' 
          OR m.target_audience = 'STUDENT'
          OR (m.target_audience = 'CLASS' AND m.class_id = $2)
        )`;
        params.push(userClassId);
      } else if (role === 'PARENT') {
        query += ` AND (
          m.target_audience = 'ALL' 
          OR m.target_audience = 'PARENT'
          OR (m.target_audience = 'CLASS' AND m.class_id IN (SELECT class_id FROM students WHERE parent_email = $${params.length + 1}))
        )`;
        params.push(req.user.email);
      } else {

        query += ` AND (m.target_audience = 'ALL' OR m.target_audience = $2)`;
        params.push(role);
      }
    }

    query += ` ORDER BY m.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, start_time, end_time, target_audience, class_id, location } = req.body;
    const org_id = req.user.org_id;
    const creator_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO meetings (org_id, creator_id, title, description, start_time, end_time, target_audience, class_id, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [org_id, creator_id, title, description, start_time, end_time || null, target_audience || 'ALL', class_id || null, location || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const org_id = req.user.org_id;

    await pool.query('DELETE FROM meetings WHERE id = $1 AND org_id = $2', [id, org_id]);
    res.json({ message: 'Meeting deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
