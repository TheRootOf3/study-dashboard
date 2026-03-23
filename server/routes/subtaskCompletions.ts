import { Router } from 'express';
import db from '../db.js';

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/subtask-completions - all subtask completions for a project
router.get('/', (req, res) => {
  const { projectId } = req.params;
  const rows = db.prepare('SELECT * FROM subtask_completions WHERE project_id = ? AND completed = 1').all(projectId);
  res.json(rows);
});

// PUT /api/projects/:projectId/subtask-completions/:subtaskId - upsert a subtask completion
router.put('/:subtaskId', (req, res) => {
  const { projectId, subtaskId } = req.params;
  const { completed } = req.body;
  const completed_at = completed ? new Date().toISOString() : null;

  db.prepare(`
    INSERT INTO subtask_completions (subtask_id, project_id, completed, completed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(subtask_id, project_id) DO UPDATE SET completed = ?, completed_at = ?
  `).run(subtaskId, projectId, completed ? 1 : 0, completed_at, completed ? 1 : 0, completed_at);

  const row = db.prepare('SELECT * FROM subtask_completions WHERE subtask_id = ? AND project_id = ?').get(subtaskId, projectId);
  res.json(row);
});

export default router;
