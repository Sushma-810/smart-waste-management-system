import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { CATEGORIES, db, findComplaint, findComplaints } from '../db.js';
import { requireAuth } from '../middleware.js';

fs.mkdirSync('uploads', { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WebP or GIF images are allowed.'));
  },
});

const router = Router();
router.use(requireAuth);

router.get('/mine', (req, res) => res.json(findComplaints('WHERE c.user_id = ?', [req.user.id])));

router.post('/', upload.single('image'), (req, res) => {
  const b = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, String(v).trim()]));
  const fail = (message) => {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message });
  };
  if ((b.title || '').length < 5) return fail('Title must be at least 5 characters.');
  if ((b.description || '').length < 10) return fail('Description must be at least 10 characters.');
  if (!CATEGORIES.includes(b.category)) return fail('Choose a valid category.');
  if (!b.location || !b.address) return fail('Location and address are required.');

  const now = new Date().toISOString();
  const { lastInsertRowid: id } = db.prepare(
    `INSERT INTO complaints (user_id, title, description, category, status, location, address, latitude, longitude, image_url, created_at)
     VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?)`
  ).run(req.user.id, b.title, b.description, b.category, b.location, b.address, b.latitude || null, b.longitude || null,
        req.file ? `uploads/${req.file.filename}` : null, now);
  db.prepare("INSERT INTO history (complaint_id, status, at) VALUES (?, 'submitted', ?)").run(id, now);
  res.status(201).json(findComplaint(id));
});

router.get('/:id', (req, res) => {
  const c = findComplaint(Number(req.params.id));
  if (!c || (req.user.role !== 'admin' && c.user.email !== req.user.email))
    return res.status(404).json({ message: 'Complaint not found.' });
  res.json(c);
});

export default router;
