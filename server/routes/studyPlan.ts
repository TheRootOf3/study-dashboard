import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/study-plan — return the full study plan
router.get('/', (_req: Request, res: Response) => {
  const row = db.prepare('SELECT data FROM study_plan WHERE id = 1').get() as { data: string } | undefined;
  if (!row) {
    res.status(404).json({ error: 'No study plan found. Place a studyPlan.json in res/ and restart.' });
    return;
  }
  res.json(JSON.parse(row.data));
});

// PUT /api/study-plan — replace the full study plan
router.put('/', (req: Request, res: Response) => {
  const data = JSON.stringify(req.body);
  db.prepare(`
    INSERT INTO study_plan (id, data) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET data = ?
  `).run(data, data);
  res.json(JSON.parse(data));
});

export default router;
