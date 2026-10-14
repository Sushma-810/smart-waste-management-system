import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

export const CATEGORIES = ['overflowing_bin', 'illegal_dumping', 'street_litter', 'missed_collection'];
export const STATUSES = ['submitted', 'assigned', 'in_progress', 'resolved'];

fs.mkdirSync('data', { recursive: true });
export const db = new DatabaseSync('data/waste.db');
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    location TEXT,
    address TEXT,
    latitude TEXT,
    longitude TEXT,
    image_url TEXT,
    assigned_to TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    at TEXT NOT NULL
  );
`);

const BASE = `SELECT c.*, u.name AS user_name, u.email AS user_email
              FROM complaints c JOIN users u ON u.id = c.user_id`;

function shape(r, history) {
  return {
    id: r.id, title: r.title, description: r.description, category: r.category, status: r.status,
    location: r.location, address: r.address, latitude: r.latitude, longitude: r.longitude,
    imageUrl: r.image_url, assignedTo: r.assigned_to || '', createdAt: r.created_at,
    user: { name: r.user_name, email: r.user_email }, history,
  };
}

export function findComplaints(where = '', params = []) {
  const rows = db.prepare(`${BASE} ${where} ORDER BY c.created_at DESC, c.id DESC`).all(...params);
  const hist = db.prepare('SELECT status, at FROM history WHERE complaint_id = ? ORDER BY id');
  return rows.map((r) => shape(r, hist.all(r.id)));
}
export const findComplaint = (id) => findComplaints('WHERE c.id = ?', [id])[0] || null;
