import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

let instance: SQLiteDatabase | null = null;

/**
 * The single on-device database. Nothing in it ever leaves the phone:
 * the app has no network code, sync or analytics.
 */
export function getDatabase(): SQLiteDatabase {
  if (instance) return instance;
  const db = openDatabaseSync('booklet.db');
  migrate(db);
  instance = db;
  return db;
}

function migrate(db: SQLiteDatabase) {
  db.execSync('PRAGMA journal_mode = WAL;');
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version < 1) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        text TEXT NOT NULL DEFAULT '',
        audio_file TEXT,
        audio_duration_ms INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS entries_date ON entries (date);
    `);
  }
  if (version < SCHEMA_VERSION) {
    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}
