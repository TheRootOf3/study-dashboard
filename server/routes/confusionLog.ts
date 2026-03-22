import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/confusion-log - all entries, with optional filters
router.get('/', (req: Request, res: Response) => {
  let sql = 'SELECT * FROM confusion_log WHERE 1=1';
  const params: unknown[] = [];

  if (req.query.resolved !== undefined) {
    sql += ' AND resolved = ?';
    params.push(req.query.resolved === 'true' ? 1 : 0);
  }

  if (req.query.weekId) {
    sql += ' AND week_id = ?';
    params.push(req.query.weekId);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// POST /api/confusion-log - create a new entry
router.post('/', (req: Request, res: Response) => {
  const { topic, description, resolution, resolved, week_id } = req.body;
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  db.prepare(`
    INSERT INTO confusion_log (id, created_at, topic, description, resolution, resolved, week_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, created_at, topic, description, resolution ?? '', resolved ? 1 : 0, week_id);

  const row = db.prepare('SELECT * FROM confusion_log WHERE id = ?').get(id);
  res.status(201).json(row);
});

// PUT /api/confusion-log/:id - update entry (partial fields)
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM confusion_log WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ['topic', 'description', 'resolution', 'resolved', 'week_id'] as const) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'resolved' ? (req.body[key] ? 1 : 0) : req.body[key]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE confusion_log SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const row = db.prepare('SELECT * FROM confusion_log WHERE id = ?').get(id);
  res.json(row);
});

// DELETE /api/confusion-log/:id - delete entry
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM confusion_log WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
