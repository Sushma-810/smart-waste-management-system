
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import adminRoutes from './routes/admin.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

// Create the administrator account on first start.
const adminEmail = (
  process.env.ADMIN_EMAIL || 'admin@wastesystem.com'
).toLowerCase();

try {
  const existingAdmin = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [adminEmail]
  );

  if (existingAdmin.rows.length === 0) {
    await db.query(
      `INSERT INTO users
       (name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        process.env.ADMIN_NAME || 'Administrator',
        adminEmail,
        await bcrypt.hash(
          process.env.ADMIN_PASSWORD || 'Admin@12345',
          10
        ),
        'admin',
        new Date().toISOString()
      ]
    );

    console.log(`Admin account created: ${adminEmail}`);
  }
} catch (error) {
  console.error('Failed to create admin account:', error);
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: (
      process.env.CORS_ORIGIN ||
      'http://localhost:5173'
    ).split(',')
  })
);

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok' })
);

// Dashboard statistics
app.get('/api/stats', async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (
          WHERE status IN ('submitted', 'assigned')
        ) AS pending
      FROM complaints
    `);

    const row = result.rows[0];

    res.json({
      total: Number(row.total),
      resolved: Number(row.resolved),
      pending: Number(row.pending)
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);

    res.status(500).json({
      message: 'Failed to fetch statistics.'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) =>
  res.status(404).json({
    message: 'Route not found.'
  })
);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image must be smaller than 5 MB.'
          : err.message
    });
  }

  if (err.message?.startsWith('Only JPG')) {
    return res.status(400).json({
      message: err.message
    });
  }

  console.error(err);

  res.status(500).json({
    message: 'Unexpected server error.'
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () =>
  console.log(
    `API running at http://localhost:${port}/api`
  )
);
