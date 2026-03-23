import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/study-plan — return the study plan for a project
router.get('/', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const row = db.prepare('SELECT data FROM study_plan WHERE project_id = ?').get(projectId) as { data: string } | undefined;
  if (!row) {
    res.status(404).json({ error: 'No study plan found for this project.' });
    return;
  }
  res.json(JSON.parse(row.data));
});

// PUT /api/projects/:projectId/study-plan — replace the study plan for a project
router.put('/', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const data = JSON.stringify(req.body);
  db.prepare(`
    INSERT INTO study_plan (project_id, data) VALUES (?, ?)
    ON CONFLICT(project_id) DO UPDATE SET data = ?
  `).run(projectId, data, data);
  res.json(JSON.parse(data));
});

export default router;
