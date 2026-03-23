import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import db, { slugify } from '../db.js';

const router = Router();

// GET /api/projects — list all, ordered by sort_order
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC').all();
  res.json(rows);
});

// POST /api/projects — create a new project
router.post('/', (req: Request, res: Response) => {
  const { name, color } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const id = crypto.randomUUID();
  const slug = slugify(name);
  const created_at = new Date().toISOString();

  // Determine next sort_order
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM projects').get() as { m: number | null }).m ?? -1;

  db.prepare(`
    INSERT INTO projects (id, name, slug, color, created_at, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), slug, color ?? '#6366f1', created_at, maxOrder + 1);

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(row);
});

// PUT /api/projects/:projectId — update a project
router.put('/:projectId', (req: Request, res: Response) => {
  const { projectId } = req.params;

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ['name', 'color', 'actual_start_date', 'schedule_config', 'sort_order'] as const) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  // If name changed, regenerate slug
  if (req.body.name !== undefined) {
    fields.push('slug = ?');
    values.push(slugify(req.body.name));
  }

  if (fields.length > 0) {
    values.push(projectId);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.json(row);
});

// DELETE /api/projects/:projectId — delete a project (CASCADE cleans up related data)
router.delete('/:projectId', (req: Request, res: Response) => {
  const { projectId } = req.params;
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  res.json({ ok: true });
});

export default router;
