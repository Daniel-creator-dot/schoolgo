import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if the user still exists in the database to prevent stale token issues after DB reset
    let userCheck;
    if (decoded.role === 'STUDENT' || decoded.role === 'PARENT') {
      userCheck = await pool.query('SELECT id FROM students WHERE id = $1', [decoded.id]);
    } else if (decoded.role === 'PARTNER') {
      userCheck = await pool.query('SELECT id FROM partners WHERE id = $1', [decoded.id]);
    } else {
      userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [decoded.id]);
    }

    if (userCheck.rowCount === 0) {
      return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('verifyToken error:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check primary role or any role in the roles array
    const userRole = req.user.role;
    const userRoles = req.user.roles || [];
    const hasRole = roles.includes(userRole) || userRoles.some((r: string) => roles.includes(r));
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
};
