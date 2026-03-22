import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

function ensureSettingsRow(): void {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO settings (id) VALUES (1)').run();
  }
}

// GET /api/settings - get user settings
router.get('/', (_req: Request, res: Response) => {
  ensureSettingsRow();
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(row);
});

// PUT /api/settings - update settings (partial fields)
router.put('/', (req: Request, res: Response) => {
  ensureSettingsRow();

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ['actual_start_date', 'theme', 'day_mapping'] as const) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`).run(...values);
  }

  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(row);
});

export default router;
