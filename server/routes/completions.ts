import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/completions - all completion records
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM completions').all();
  res.json(rows);
});

// PUT /api/completions/:slotId - upsert a completion
router.put('/:slotId', (req: Request, res: Response) => {
  const { slotId } = req.params;
  const { completed, notes, difficulty } = req.body;

  const stmt = db.prepare(`
    INSERT INTO completions (slot_id, completed, completed_at, notes, difficulty)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slot_id) DO UPDATE SET
      completed = excluded.completed,
      completed_at = excluded.completed_at,
      notes = excluded.notes,
      difficulty = excluded.difficulty
  `);

  const completedAt = completed ? new Date().toISOString() : null;
  stmt.run(slotId, completed ? 1 : 0, completedAt, notes ?? '', difficulty ?? null);

  const row = db.prepare('SELECT * FROM completions WHERE slot_id = ?').get(slotId);
  res.json(row);
});

// DELETE /api/completions/:slotId - remove a completion
router.delete('/:slotId', (req: Request, res: Response) => {
  const { slotId } = req.params;
  db.prepare('DELETE FROM completions WHERE slot_id = ?').run(slotId);
  res.json({ ok: true });
});

export default router;
