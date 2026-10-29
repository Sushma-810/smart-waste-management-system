
import { Router } from 'express';
import {
  STATUSES,
  db,
  findComplaint,
  findComplaints
} from '../db.js';
import { requireAdmin, requireAuth } from '../middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// Get all complaints
router.get('/complaints', async (_req, res) => {
  try {
    const complaints = await findComplaints();
    res.json(complaints);
  } catch (error) {
    console.error('Failed to fetch complaints:', error);

    res.status(500).json({
      message: 'Failed to fetch complaints.'
    });
  }
});

// Get one complaint
router.get('/complaints/:id', async (req, res) => {
  try {
    const c = await findComplaint(Number(req.params.id));

    if (!c) {
      return res.status(404).json({
        message: 'Complaint not found.'
      });
    }

    res.json(c);
  } catch (error) {
    console.error('Failed to fetch complaint:', error);

    res.status(500).json({
      message: 'Failed to fetch complaint.'
    });
  }
});

// Update complaint status / assignment
router.patch('/complaints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const current = await findComplaint(id);

    if (!current) {
      return res.status(404).json({
        message: 'Complaint not found.'
      });
    }

    const { status, assignedTo } = req.body;

    if (
      status !== undefined &&
      !STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: 'Invalid status.'
      });
    }

    // Update assigned staff
    if (assignedTo !== undefined) {
      await db.query(
        `UPDATE complaints
         SET assigned_to = $1
         WHERE id = $2`,
        [
          String(assignedTo).trim(),
          id
        ]
      );
    }

    // Update status
    if (
      status !== undefined &&
      status !== current.status
    ) {
      const now = new Date().toISOString();

      await db.query(
        `UPDATE complaints
         SET status = $1
         WHERE id = $2`,
        [
          status,
          id
        ]
      );

      // Add status change to history
      await db.query(
        `INSERT INTO history
         (complaint_id, status, at)
         VALUES ($1, $2, $3)`,
        [
          id,
          status,
          now
        ]
      );
    }

    const updatedComplaint = await findComplaint(id);

    res.json(updatedComplaint);

  } catch (error) {
    console.error('Failed to update complaint:', error);

    res.status(500).json({
      message: 'Failed to update complaint.'
    });
  }
});

export default router;
