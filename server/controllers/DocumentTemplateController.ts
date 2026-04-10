import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

export const getDocumentTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'SELECT id, name, type, layout_config, created_at, updated_at FROM document_templates WHERE org_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createDocumentTemplate = async (req: AuthRequest, res: Response) => {
  const { name, type, layout_config } = req.body;
  try {
    const orgId = req.user.org_id;
    
    if (!orgId) throw new Error('Organization ID is missing in request user context');

    const result = await pool.query(
      'INSERT INTO document_templates (org_id, name, type, layout_config) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, name, type, layout_config || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDocumentTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, type, layout_config } = req.body;
  try {
    const orgId = req.user.org_id;

    const result = await pool.query(
      `UPDATE document_templates 
       SET name = $1, type = $2, layout_config = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND org_id = $5 
       RETURNING *`,
      [name, type, layout_config || {}, id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDocumentTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'DELETE FROM document_templates WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
