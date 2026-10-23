import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CATEGORIES, db, findComplaint, findComplaints } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();

router.use(requireAuth);

// AWS S3 configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'eco-waste-s3';

// Store uploaded image in memory temporarily.
// The image will then be uploaded directly to S3.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error('Only JPG, PNG, WebP or GIF images are allowed.'));
  },
});

router.get('/mine', (req, res) =>
  res.json(findComplaints('WHERE c.user_id = ?', [req.user.id]))
);

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const b = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, String(v).trim()])
    );

    const fail = (message) => {
      return res.status(400).json({ message });
    };

    if ((b.title || '').length < 5) {
      return fail('Title must be at least 5 characters.');
    }

    if ((b.description || '').length < 10) {
      return fail('Description must be at least 10 characters.');
    }

    if (!CATEGORIES.includes(b.category)) {
      return fail('Choose a valid category.');
    }

    if (!b.location || !b.address) {
      return fail('Location and address are required.');
    }

    let imageUrl = null;

    // Upload complaint image to AWS S3
    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${crypto.randomUUID()}${extension}`;
      const s3Key = `complaints/${fileName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

      console.log(`Image uploaded to S3: ${s3Key}`);
    }

    const now = new Date().toISOString();

    const { lastInsertRowid: id } = db
      .prepare(
        `INSERT INTO complaints
        (user_id, title, description, category, status, location, address, latitude, longitude, image_url, created_at)
        VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        b.title,
        b.description,
        b.category,
        b.location,
        b.address,
        b.latitude || null,
        b.longitude || null,
        imageUrl,
        now
      );

    db.prepare(
      "INSERT INTO history (complaint_id, status, at) VALUES (?, 'submitted', ?)"
    ).run(id, now);

    res.status(201).json(findComplaint(id));
  } catch (error) {
    console.error('Complaint submission failed:', error);

    res.status(500).json({
      message: 'Failed to submit complaint.',
    });
  }
});

router.get('/:id', (req, res) => {
  const c = findComplaint(Number(req.params.id));

  if (!c || (req.user.role !== 'admin' && c.user.email !== req.user.email)) {
    return res.status(404).json({ message: 'Complaint not found.' });
  }

  res.json(c);
});

export default router;
