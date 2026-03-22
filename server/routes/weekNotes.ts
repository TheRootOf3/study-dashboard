import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/week-notes/:weekId - get notes for a week
router.get('/:weekId', (req: Request, res: Response) => {
  const { weekId } = req.params;
  const row = db.prepare('SELECT * FROM week_notes WHERE week_id = ?').get(weekId);
  res.json(row ?? { week_id: weekId, notes: '' });
});

// PUT /api/week-notes/:weekId - upsert notes
router.put('/:weekId', (req: Request, res: Response) => {
  const { weekId } = req.params;
  const { notes } = req.body;

  db.prepare(`
    INSERT INTO week_notes (week_id, notes)
    VALUES (?, ?)
    ON CONFLICT(week_id) DO UPDATE SET notes = excluded.notes
  `).run(weekId, notes ?? '');

  const row = db.prepare('SELECT * FROM week_notes WHERE week_id = ?').get(weekId);
  res.json(row);
});

export default router;
