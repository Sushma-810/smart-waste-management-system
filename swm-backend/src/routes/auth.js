import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, signToken } from '../middleware.js';

const router = Router();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role
});

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) {
      return res.status(400).json({
        message: 'Enter your full name.'
      });
    }

    if (!EMAIL.test(email)) {
      return res.status(400).json({
        message: 'Enter a valid email address.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.'
      });
    }

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users
       (name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [
        name,
        email,
        hash,
        'citizen',
        new Date().toISOString()
      ]
    );

    const user = result.rows[0];

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Unable to create account.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: 'Incorrect email or password.'
      });
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Unable to login.'
    });
  }
});

router.get('/me', requireAuth, (req, res) =>
  res.json({ user: req.user })
);

export default router;
