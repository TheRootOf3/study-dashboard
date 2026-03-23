import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/week-notes/:weekId - get notes for a week in a project
router.get('/:weekId', (req: Request, res: Response) => {
  const { projectId, weekId } = req.params;
  const row = db.prepare('SELECT * FROM week_notes WHERE week_id = ? AND project_id = ?').get(weekId, projectId);
  res.json(row ?? { week_id: weekId, project_id: projectId, notes: '' });
});

// PUT /api/projects/:projectId/week-notes/:weekId - upsert notes
router.put('/:weekId', (req: Request, res: Response) => {
  const { projectId, weekId } = req.params;
  const { notes } = req.body;

  db.prepare(`
    INSERT INTO week_notes (week_id, project_id, notes)
    VALUES (?, ?, ?)
    ON CONFLICT(week_id, project_id) DO UPDATE SET notes = excluded.notes
  `).run(weekId, projectId, notes ?? '');

  const row = db.prepare('SELECT * FROM week_notes WHERE week_id = ? AND project_id = ?').get(weekId, projectId);
  res.json(row);
});

export default router;
