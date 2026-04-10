import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// Get all folders and files for the user/org
export const getDriveItems = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    // Assuming organization-wide shared drive for admins/staff since it's a school management system
    // Or we could strict filter by owner_id. Let's return all org files for now to simulate a shared staff drive.
    
    const foldersRes = await pool.query(
      `SELECT df.*, u.name as owner_name 
       FROM drive_folders df 
       LEFT JOIN users u ON df.owner_id = u.id 
       WHERE df.org_id = $1 
       ORDER BY df.created_at DESC`, 
      [orgId]
    );

    const filesRes = await pool.query(
      `SELECT d.*, u.name as owner_name 
       FROM drive_files d 
       LEFT JOIN users u ON d.owner_id = u.id 
       WHERE d.org_id = $1 
       ORDER BY d.created_at DESC`, 
      [orgId]
    );

    res.json({
      folders: foldersRes.rows,
      files: filesRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const result = await pool.query(
      'INSERT INTO drive_folders (org_id, owner_id, name) VALUES ($1, $2, $3) RETURNING *',
      [orgId, userId, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadFile = async (req: AuthRequest, res: Response) => {
  // We expect file_url to be a base64 string for this implementation
  const { name, size, type, file_url, folder_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    if (!name || !file_url) return res.status(400).json({ error: 'File name and content are required' });

    const result = await pool.query(
      `INSERT INTO drive_files (org_id, owner_id, folder_id, name, size, type, file_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orgId, userId, folder_id || null, name, size || 0, type || 'unknown', file_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('DELETE FROM drive_files WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'File not found' });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    // Because of ON DELETE CASCADE on folder_id, files inside will also be deleted
    const result = await pool.query('DELETE FROM drive_folders WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const moveFile = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { folder_id } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE drive_files SET folder_id = $1 WHERE id = $2 AND org_id = $3 RETURNING *',
      [folder_id || null, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'File not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
