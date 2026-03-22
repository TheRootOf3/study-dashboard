import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET all subtask completions
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM subtask_completions WHERE completed = 1').all();
  res.json(rows);
});

// PUT upsert a subtask completion
router.put('/:subtaskId', (req, res) => {
  const { subtaskId } = req.params;
  const { completed } = req.body;
  const completed_at = completed ? new Date().toISOString() : null;

  db.prepare(`
    INSERT INTO subtask_completions (subtask_id, completed, completed_at)
    VALUES (?, ?, ?)
    ON CONFLICT(subtask_id) DO UPDATE SET completed = ?, completed_at = ?
  `).run(subtaskId, completed ? 1 : 0, completed_at, completed ? 1 : 0, completed_at);

  const row = db.prepare('SELECT * FROM subtask_completions WHERE subtask_id = ?').get(subtaskId);
  res.json(row);
});

export default router;
