import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/completions - all completion records for a project
router.get('/', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const rows = db.prepare('SELECT * FROM completions WHERE project_id = ?').all(projectId);
  res.json(rows);
});

// PUT /api/projects/:projectId/completions/:slotId - upsert a completion
router.put('/:slotId', (req: Request, res: Response) => {
  const { projectId, slotId } = req.params;
  const { completed, notes, difficulty } = req.body;

  const stmt = db.prepare(`
    INSERT INTO completions (slot_id, project_id, completed, completed_at, notes, difficulty)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slot_id, project_id) DO UPDATE SET
      completed = excluded.completed,
      completed_at = excluded.completed_at,
      notes = excluded.notes,
      difficulty = excluded.difficulty
  `);

  const completedAt = completed ? new Date().toISOString() : null;
  stmt.run(slotId, projectId, completed ? 1 : 0, completedAt, notes ?? '', difficulty ?? null);

  const row = db.prepare('SELECT * FROM completions WHERE slot_id = ? AND project_id = ?').get(slotId, projectId);
  res.json(row);
});

// DELETE /api/projects/:projectId/completions/:slotId - remove a completion
router.delete('/:slotId', (req: Request, res: Response) => {
  const { projectId, slotId } = req.params;
  db.prepare('DELETE FROM completions WHERE slot_id = ? AND project_id = ?').run(slotId, projectId);
  res.json({ ok: true });
});

export default router;
