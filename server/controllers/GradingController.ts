import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// GRADING SCALES
export const getGradingScales = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = 'SELECT * FROM grading_scales WHERE 1=1';
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND org_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    
    // Fetch levels and assigned classes for each scale
    const scalesWithData = await Promise.all(result.rows.map(async (scale) => {
      const levels = await pool.query('SELECT * FROM grading_scale_levels WHERE scale_id = $1 ORDER BY min_score DESC', [scale.id]);
      const classes = await pool.query('SELECT id, name FROM classes WHERE grading_scale_id = $1', [scale.id]);
      return { 
        ...scale, 
        levels: levels.rows,
        assigned_classes: classes.rows 
      };
    }));

    res.json(scalesWithData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createGradingScale = async (req: AuthRequest, res: Response) => {
  let { name, description, status, levels, assignedClassIds } = req.body;
  if (typeof levels === 'string') {
    try {
      levels = JSON.parse(levels);
    } catch (e) {
      levels = [];
    }
  }
  
  if (typeof assignedClassIds === 'string') {
    try {
      assignedClassIds = JSON.parse(assignedClassIds);
    } catch (e) {
      assignedClassIds = [];
    }
  }

  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;
    await client.query('BEGIN');

    const scaleResult = await client.query(
      'INSERT INTO grading_scales (org_id, name, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, name, description, status || 'Active']
    );
    const newScale = scaleResult.rows[0];

    if (levels && Array.isArray(levels)) {
      for (const level of levels) {
        await client.query(
          'INSERT INTO grading_scale_levels (scale_id, grade, min_score, max_score, description) VALUES ($1, $2, $3, $4, $5)',
          [newScale.id, level.grade, level.min_score, level.max_score, level.description]
        );
      }
    }

    if (assignedClassIds && Array.isArray(assignedClassIds)) {
      for (const classId of assignedClassIds) {
        await client.query(
          'UPDATE classes SET grading_scale_id = $1 WHERE id = $2 AND org_id = $3',
          [newScale.id, classId, orgId]
        );
      }
    }

    await client.query('COMMIT');
    
    // Fetch completed object
    const finalLevels = await client.query('SELECT * FROM grading_scale_levels WHERE scale_id = $1 ORDER BY min_score DESC', [newScale.id]);
    const finalClasses = await client.query('SELECT id, name FROM classes WHERE grading_scale_id = $1', [newScale.id]);
    res.status(201).json({ ...newScale, levels: finalLevels.rows, assigned_classes: finalClasses.rows });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateGradingScale = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  let { name, description, status, levels, assignedClassIds } = req.body;
  
  if (typeof levels === 'string') {
    try {
      levels = JSON.parse(levels);
    } catch (e) {
      levels = [];
    }
  }

  if (typeof assignedClassIds === 'string') {
    try {
      assignedClassIds = JSON.parse(assignedClassIds);
    } catch (e) {
      assignedClassIds = [];
    }
  }

  const client = await pool.connect();
  try {
    const orgId = req.user.org_id;
    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE grading_scales SET name = $1, description = $2, status = $3 WHERE id = $4 AND org_id = $5 RETURNING *',
      [name, description, status, id, orgId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Grading scale not found' });
    }

    const updatedScale = result.rows[0];

    // Update Levels
    if (levels && Array.isArray(levels)) {
      await client.query('DELETE FROM grading_scale_levels WHERE scale_id = $1', [id]);
      for (const level of levels) {
        await client.query(
          'INSERT INTO grading_scale_levels (scale_id, grade, min_score, max_score, description) VALUES ($1, $2, $3, $4, $5)',
          [id, level.grade, level.min_score, level.max_score, level.description]
        );
      }
    }

    // Update Class Assignments
    if (assignedClassIds && Array.isArray(assignedClassIds)) {
      await client.query('UPDATE classes SET grading_scale_id = NULL WHERE grading_scale_id = $1 AND org_id = $2', [id, orgId]);
      for (const classId of assignedClassIds) {
        await client.query(
          'UPDATE classes SET grading_scale_id = $1 WHERE id = $2 AND org_id = $3',
          [id, classId, orgId]
        );
      }
    }

    await client.query('COMMIT');
    
    const finalLevels = await client.query('SELECT * FROM grading_scale_levels WHERE scale_id = $1 ORDER BY min_score DESC', [id]);
    const finalClasses = await client.query('SELECT id, name FROM classes WHERE grading_scale_id = $1', [id]);
    res.json({ ...updatedScale, levels: finalLevels.rows, assigned_classes: finalClasses.rows });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteGradingScale = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    // Note: grading_scale_levels has ON DELETE CASCADE in schema
    const result = await pool.query('DELETE FROM grading_scales WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grading scale not found' });
    
    // Also clear references in classes table
    await pool.query('UPDATE classes SET grading_scale_id = NULL WHERE grading_scale_id = $1 AND org_id = $2', [id, orgId]);
    
    res.json({ message: 'Grading scale deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
