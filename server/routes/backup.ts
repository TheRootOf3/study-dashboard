import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

const TABLES = ['completions', 'confusion_log', 'week_notes', 'settings', 'subtask_completions'] as const;

// GET /api/backup - export entire DB as JSON
router.get('/', (_req: Request, res: Response) => {
  const data: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    data[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }
  res.json(data);
});

// POST /api/backup - import JSON, replacing all data
router.post('/', (req: Request, res: Response) => {
  const data = req.body as Record<string, Record<string, unknown>[]>;

  const importAll = db.transaction(() => {
    for (const table of TABLES) {
      db.prepare(`DELETE FROM ${table}`).run();
    }

    if (data.completions) {
      const stmt = db.prepare(`
        INSERT INTO completions (slot_id, completed, completed_at, notes, difficulty)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const row of data.completions) {
        stmt.run(row.slot_id, row.completed, row.completed_at, row.notes, row.difficulty);
      }
    }

    if (data.confusion_log) {
      const stmt = db.prepare(`
        INSERT INTO confusion_log (id, created_at, topic, description, resolution, resolved, week_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of data.confusion_log) {
        stmt.run(row.id, row.created_at, row.topic, row.description, row.resolution, row.resolved, row.week_id);
      }
    }

    if (data.week_notes) {
      const stmt = db.prepare(`
        INSERT INTO week_notes (week_id, notes) VALUES (?, ?)
      `);
      for (const row of data.week_notes) {
        stmt.run(row.week_id, row.notes);
      }
    }

    if (data.settings) {
      const stmt = db.prepare(`
        INSERT INTO settings (id, actual_start_date, theme, day_mapping)
        VALUES (?, ?, ?, ?)
      `);
      for (const row of data.settings) {
        stmt.run(row.id, row.actual_start_date, row.theme, row.day_mapping);
      }
    }

    if (data.subtask_completions) {
      const stmt = db.prepare(`
        INSERT INTO subtask_completions (subtask_id, completed, completed_at)
        VALUES (?, ?, ?)
      `);
      for (const row of data.subtask_completions) {
        stmt.run(row.subtask_id, row.completed, row.completed_at);
      }
    }
  });

  importAll();
  res.json({ ok: true });
});

export default router;
