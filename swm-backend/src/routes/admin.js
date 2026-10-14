import { Router } from 'express';
import { STATUSES, db, findComplaint, findComplaints } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/complaints', (_req, res) => res.json(findComplaints()));

router.get('/complaints/:id', (req, res) => {
  const c = findComplaint(Number(req.params.id));
  if (!c) return res.status(404).json({ message: 'Complaint not found.' });
  res.json(c);
});

router.patch('/complaints/:id', (req, res) => {
  const id = Number(req.params.id);
  const current = findComplaint(id);
  if (!current) return res.status(404).json({ message: 'Complaint not found.' });
  const { status, assignedTo } = req.body;
  if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

  if (assignedTo !== undefined)
    db.prepare('UPDATE complaints SET assigned_to = ? WHERE id = ?').run(String(assignedTo).trim(), id);
  if (status !== undefined && status !== current.status) {
    db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, id);
    db.prepare('INSERT INTO history (complaint_id, status, at) VALUES (?, ?, ?)').run(id, status, new Date().toISOString());
  }
  res.json(findComplaint(id));
});

export default router;
