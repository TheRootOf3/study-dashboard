import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'progress.db');

const db = new Database(dbPath);

export function initDatabase(): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS study_plan (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completions (
      slot_id TEXT PRIMARY KEY,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      notes TEXT DEFAULT '',
      difficulty INTEGER
    );

    CREATE TABLE IF NOT EXISTS confusion_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      topic TEXT NOT NULL,
      description TEXT NOT NULL,
      resolution TEXT DEFAULT '',
      resolved INTEGER NOT NULL DEFAULT 0,
      week_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS week_notes (
      week_id TEXT PRIMARY KEY,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      actual_start_date TEXT,
      theme TEXT DEFAULT 'light',
      day_mapping TEXT,
      schedule_config TEXT
    );

    CREATE TABLE IF NOT EXISTS subtask_completions (
      subtask_id TEXT PRIMARY KEY,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    );
  `);

  // Seed study plan from JSON file if the table is empty
  const row = db.prepare('SELECT id FROM study_plan WHERE id = 1').get();
  if (!row) {
    const seedPath = path.join(__dirname, '..', 'res', 'studyPlan.json');
    if (fs.existsSync(seedPath)) {
      const data = fs.readFileSync(seedPath, 'utf8');
      // Validate it's valid JSON
      JSON.parse(data);
      db.prepare('INSERT INTO study_plan (id, data) VALUES (1, ?)').run(data);
      console.log('Seeded study plan from res/studyPlan.json');
    } else {
      console.warn('No seed file found at res/studyPlan.json — study plan table is empty');
    }
  }
}

export default db;
