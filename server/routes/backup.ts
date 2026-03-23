import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

const TABLES = ['projects', 'global_settings', 'completions', 'confusion_log', 'week_notes', 'subtask_completions', 'study_plan'] as const;

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
    // Delete in reverse dependency order
    for (const table of ['completions', 'confusion_log', 'week_notes', 'subtask_completions', 'study_plan', 'global_settings', 'projects'] as const) {
      db.prepare(`DELETE FROM ${table}`).run();
    }

    // Import projects first (other tables reference them)
    if (data.projects) {
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, slug, color, actual_start_date, schedule_config, created_at, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of data.projects) {
        stmt.run(row.id, row.name, row.slug, row.color, row.actual_start_date, row.schedule_config, row.created_at, row.sort_order);
      }
    }

    if (data.global_settings) {
      const stmt = db.prepare(`
        INSERT INTO global_settings (id, theme) VALUES (?, ?)
      `);
      for (const row of data.global_settings) {
        stmt.run(row.id, row.theme);
      }
    }

    if (data.completions) {
      const stmt = db.prepare(`
        INSERT INTO completions (slot_id, project_id, completed, completed_at, notes, difficulty)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const row of data.completions) {
        stmt.run(row.slot_id, row.project_id, row.completed, row.completed_at, row.notes, row.difficulty);
      }
    }

    if (data.confusion_log) {
      const stmt = db.prepare(`
        INSERT INTO confusion_log (id, project_id, created_at, topic, description, resolution, resolved, week_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of data.confusion_log) {
        stmt.run(row.id, row.project_id, row.created_at, row.topic, row.description, row.resolution, row.resolved, row.week_id);
      }
    }

    if (data.week_notes) {
      const stmt = db.prepare(`
        INSERT INTO week_notes (week_id, project_id, notes) VALUES (?, ?, ?)
      `);
      for (const row of data.week_notes) {
        stmt.run(row.week_id, row.project_id, row.notes);
      }
    }

    if (data.subtask_completions) {
      const stmt = db.prepare(`
        INSERT INTO subtask_completions (subtask_id, project_id, completed, completed_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const row of data.subtask_completions) {
        stmt.run(row.subtask_id, row.project_id, row.completed, row.completed_at);
      }
    }

    if (data.study_plan) {
      const stmt = db.prepare(`
        INSERT INTO study_plan (project_id, data) VALUES (?, ?)
      `);
      for (const row of data.study_plan) {
        stmt.run(row.project_id, row.data);
      }
    }
  });

  importAll();
  res.json({ ok: true });
});

export default router;
