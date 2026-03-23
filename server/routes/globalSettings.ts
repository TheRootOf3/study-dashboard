import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

function ensureRow(): void {
  const row = db.prepare('SELECT * FROM global_settings WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO global_settings (id, theme) VALUES (1, ?)').run('light');
  }
}

// GET /api/global-settings
router.get('/', (_req: Request, res: Response) => {
  ensureRow();
  const row = db.prepare('SELECT * FROM global_settings WHERE id = 1').get();
  res.json(row);
});

// PUT /api/global-settings
router.put('/', (req: Request, res: Response) => {
  ensureRow();
  const { theme } = req.body;

  if (theme !== undefined) {
    db.prepare('UPDATE global_settings SET theme = ? WHERE id = 1').run(theme);
  }

  const row = db.prepare('SELECT * FROM global_settings WHERE id = 1').get();
  res.json(row);
});

export default router;
