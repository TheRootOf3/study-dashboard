import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'progress.db');

const db = new Database(dbPath);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function initDatabase(): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // --- (a) Always create new tables ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      actual_start_date TEXT,
      schedule_config TEXT,
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS global_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT DEFAULT 'light'
    );
  `);

  // --- (b) One-time migration from old schema ---
  const oldSettingsExists = (db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
  ).get() as { name: string } | undefined);

  if (oldSettingsExists) {
    console.log('Detected old settings table — running one-time migration...');

    const migrate = db.transaction(() => {
      // Read old settings
      const oldSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as {
        actual_start_date?: string;
        theme?: string;
        schedule_config?: string;
      } | undefined;

      // Create default project
      const projectId = 'default';
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR IGNORE INTO projects (id, name, slug, color, actual_start_date, schedule_config, created_at, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        projectId,
        'My Study Plan',
        'my-study-plan',
        '#6366f1',
        oldSettings?.actual_start_date ?? null,
        oldSettings?.schedule_config ?? null,
        now,
        0
      );

      // Copy theme to global_settings
      db.prepare(`
        INSERT OR IGNORE INTO global_settings (id, theme) VALUES (1, ?)
      `).run(oldSettings?.theme ?? 'light');

      // --- Migrate completions: add project_id to composite PK ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS completions_new (
          slot_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          completed_at TEXT,
          notes TEXT DEFAULT '',
          difficulty INTEGER,
          PRIMARY KEY (slot_id, project_id),
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);
      // Check if old completions table exists and has rows
      const oldCompletionsExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='completions'"
      ).get();
      if (oldCompletionsExists) {
        db.exec(`
          INSERT OR IGNORE INTO completions_new (slot_id, project_id, completed, completed_at, notes, difficulty)
          SELECT slot_id, '${projectId}', completed, completed_at, notes, difficulty FROM completions;
        `);
        db.exec('DROP TABLE completions;');
      }
      db.exec('ALTER TABLE completions_new RENAME TO completions;');

      // --- Migrate subtask_completions ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS subtask_completions_new (
          subtask_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          completed_at TEXT,
          PRIMARY KEY (subtask_id, project_id),
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);
      const oldSubtaskExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='subtask_completions'"
      ).get();
      if (oldSubtaskExists) {
        db.exec(`
          INSERT OR IGNORE INTO subtask_completions_new (subtask_id, project_id, completed, completed_at)
          SELECT subtask_id, '${projectId}', completed, completed_at FROM subtask_completions;
        `);
        db.exec('DROP TABLE subtask_completions;');
      }
      db.exec('ALTER TABLE subtask_completions_new RENAME TO subtask_completions;');

      // --- Migrate confusion_log: add project_id ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS confusion_log_new (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL,
          topic TEXT NOT NULL,
          description TEXT NOT NULL,
          resolution TEXT DEFAULT '',
          resolved INTEGER NOT NULL DEFAULT 0,
          week_id TEXT NOT NULL
        );
      `);
      const oldConfusionExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='confusion_log'"
      ).get();
      if (oldConfusionExists) {
        db.exec(`
          INSERT OR IGNORE INTO confusion_log_new (id, project_id, created_at, topic, description, resolution, resolved, week_id)
          SELECT id, '${projectId}', created_at, topic, description, resolution, resolved, week_id FROM confusion_log;
        `);
        db.exec('DROP TABLE confusion_log;');
      }
      db.exec('ALTER TABLE confusion_log_new RENAME TO confusion_log;');

      // --- Migrate week_notes: add project_id to composite PK ---
      db.exec(`
        CREATE TABLE IF NOT EXISTS week_notes_new (
          week_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          notes TEXT DEFAULT '',
          PRIMARY KEY (week_id, project_id),
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);
      const oldWeekNotesExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='week_notes'"
      ).get();
      if (oldWeekNotesExists) {
        db.exec(`
          INSERT OR IGNORE INTO week_notes_new (week_id, project_id, notes)
          SELECT week_id, '${projectId}', notes FROM week_notes;
        `);
        db.exec('DROP TABLE week_notes;');
      }
      db.exec('ALTER TABLE week_notes_new RENAME TO week_notes;');

      // --- Migrate study_plan: change from id=1 to project_id-keyed ---
      const oldPlanRow = db.prepare('SELECT data FROM study_plan WHERE id = 1').get() as { data: string } | undefined;
      db.exec('DROP TABLE IF EXISTS study_plan;');
      db.exec(`
        CREATE TABLE study_plan (
          project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
          data TEXT NOT NULL
        );
      `);
      if (oldPlanRow) {
        db.prepare('INSERT INTO study_plan (project_id, data) VALUES (?, ?)').run(projectId, oldPlanRow.data);
      }

      // Drop old settings table
      db.exec('DROP TABLE settings;');
    });

    migrate();
    console.log('Migration complete.');
  } else {
    // --- (c) Ensure new-schema tables exist (fresh DB or already migrated) ---
    db.exec(`
      CREATE TABLE IF NOT EXISTS completions (
        slot_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        notes TEXT DEFAULT '',
        difficulty INTEGER,
        PRIMARY KEY (slot_id, project_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subtask_completions (
        subtask_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        PRIMARY KEY (subtask_id, project_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS confusion_log (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        topic TEXT NOT NULL,
        description TEXT NOT NULL,
        resolution TEXT DEFAULT '',
        resolved INTEGER NOT NULL DEFAULT 0,
        week_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS week_notes (
        week_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        notes TEXT DEFAULT '',
        PRIMARY KEY (week_id, project_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS study_plan (
        project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
        data TEXT NOT NULL
      );
    `);
  }

  // --- (d) Seed logic: On fresh DB, check for studyPlan.json ---
  const projectCount = (db.prepare('SELECT COUNT(*) as cnt FROM projects').get() as { cnt: number }).cnt;
  if (projectCount === 0) {
    const seedPath = path.join(__dirname, '..', 'res', 'studyPlan.json');
    if (fs.existsSync(seedPath)) {
      const data = fs.readFileSync(seedPath, 'utf8');
      // Validate it's valid JSON
      JSON.parse(data);

      const projectId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO projects (id, name, slug, color, created_at, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(projectId, 'My Study Plan', 'my-study-plan', '#6366f1', now, 0);

      db.prepare('INSERT INTO study_plan (project_id, data) VALUES (?, ?)').run(projectId, data);

      // Ensure global_settings row exists
      db.prepare('INSERT OR IGNORE INTO global_settings (id, theme) VALUES (1, ?)').run('light');

      console.log('Seeded default project and study plan from res/studyPlan.json');
    } else {
      // No seed file — welcome screen will handle project creation
      db.prepare('INSERT OR IGNORE INTO global_settings (id, theme) VALUES (1, ?)').run('light');
      console.log('No seed file found — fresh DB ready for project creation via UI');
    }
  }
}

export { slugify };
export default db;
