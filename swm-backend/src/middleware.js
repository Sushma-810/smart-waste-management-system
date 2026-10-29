import jwt from 'jsonwebtoken';
import { db } from './db.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      message: 'Please sign in to continue.'
    });
  }

  try {
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [sub]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Account no longer exists.'
      });
    }

    req.user = { ...user };
    next();
  } catch {
    res.status(401).json({
      message: 'Session expired. Please sign in again.'
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      message: 'Administrators only.'
    });
  }

  next();
}
