import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import fs from 'fs';

const logError = (error: any) => {
  const logMessage = `${new Date().toISOString()} - ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
  fs.appendFileSync('server_error.log', logMessage);
};

export const getReportCardTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'SELECT * FROM report_card_templates WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    logError(err);
    res.status(500).json({ error: err.message });
  }
};

export const createReportCardTemplate = async (req: AuthRequest, res: Response) => {
  const { name, description, layout, sections, is_default } = req.body;
  try {
    const orgId = req.user.org_id;
    
    if (!orgId) throw new Error('Organization ID is missing in request user context');

    // If setting as default, unset others first
    if (is_default) {
      await pool.query('UPDATE report_card_templates SET is_default = false WHERE org_id = $1', [orgId]);
    }

    const result = await pool.query(
      'INSERT INTO report_card_templates (org_id, name, description, layout, sections, is_default) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgId, name, description || '', JSON.stringify(layout || {}), JSON.stringify(sections || []), is_default === 'on' || is_default === true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    logError(err);
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateReportCardTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, layout, sections, is_default } = req.body;
  try {
    const orgId = req.user.org_id;
    console.log(`Updating template ${id} for org ${orgId}. Payload:`, req.body);

    const isDefaultValue = is_default === 'on' || is_default === true || is_default === 'true';

    if (isDefaultValue) {
      await pool.query('UPDATE report_card_templates SET is_default = false WHERE org_id = $1', [orgId]);
    }

    const result = await pool.query(
      'UPDATE report_card_templates SET name = $1, description = $2, layout = $3, sections = $4, is_default = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [name, description || '', JSON.stringify(layout || {}), JSON.stringify(sections || []), isDefaultValue, id, orgId]
    );

    if (result.rows.length === 0) {
      console.warn(`Template ${id} not found for org ${orgId}`);
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log(`Template ${id} updated successfully`);
    res.json(result.rows[0]);
  } catch (err: any) {
    logError(err);
    console.error('Update Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteReportCardTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'DELETE FROM report_card_templates WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (err: any) {
    logError(err);
    res.status(500).json({ error: err.message });
  }
};
