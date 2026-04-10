import express from 'express';
import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';

// MY DRIVE / FILES
export const getFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { parentFolderId } = req.query;
    
    let query = 'SELECT * FROM file_metadata WHERE user_id = $1';
    const params: any[] = [userId];

    if (parentFolderId) {
      params.push(parentFolderId);
      query += ` AND parent_folder_id = $${params.length}`;
    } else {
      query += ` AND parent_folder_id IS NULL`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createFile = async (req: AuthRequest, res: Response) => {
  const { name, size, type, path, parent_folder_id, is_folder } = req.body;
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'INSERT INTO file_metadata (user_id, name, size, type, path, parent_folder_id, is_folder) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, size, type, path, parent_folder_id, is_folder]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM file_metadata WHERE id = $1 AND user_id = $2', [id, userId]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
