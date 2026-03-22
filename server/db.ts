import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'progress.db');

const db = new Database(dbPath);

export function initDatabase(): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
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
      day_mapping TEXT
    );

    CREATE TABLE IF NOT EXISTS subtask_completions (
      subtask_id TEXT PRIMARY KEY,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    );
  `);
}

export default db;
