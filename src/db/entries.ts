import { getDatabase } from './database';
import type { Entry, NewEntry } from './types';
import { recordingUri, deleteRecording } from '../audio/storage';

type Row = {
  id: string;
  date: string;
  text: string;
  audio_file: string | null;
  audio_duration_ms: number | null;
  created_at: number;
  updated_at: number;
};

async function toEntry(row: Row): Promise<Entry> {
  return {
    id: row.id,
    date: row.date,
    text: row.text,
    audioUri: row.audio_file ? await recordingUri(row.audio_file) : null,
    audioDurationMs: row.audio_duration_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function newId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}`;
}

/** All entries, newest day first, newest written first within a day. */
export async function listEntries(): Promise<Entry[]> {
  const rows = await getDatabase().getAllAsync<Row>(
    'SELECT * FROM entries ORDER BY date DESC, created_at DESC',
  );
  return Promise.all(rows.map(toEntry));
}

export async function createEntry(input: NewEntry, id: string = newId()): Promise<Entry> {
  const now = Date.now();
  await getDatabase().runAsync(
    `INSERT INTO entries (id, date, text, audio_file, audio_duration_ms, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.date,
    input.text,
    input.audioFile ?? null,
    input.audioDurationMs ?? null,
    now,
    now,
  );
  const row = await getDatabase().getFirstAsync<Row>('SELECT * FROM entries WHERE id = ?', id);
  if (!row) throw new Error('Entry was not saved');
  return toEntry(row);
}

export async function updateEntryText(id: string, text: string): Promise<void> {
  await getDatabase().runAsync(
    'UPDATE entries SET text = ?, updated_at = ? WHERE id = ?',
    text,
    Date.now(),
    id,
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const db = getDatabase();
  const row = await db.getFirstAsync<Row>('SELECT * FROM entries WHERE id = ?', id);
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
  if (row?.audio_file) await deleteRecording(row.audio_file);
}

export async function deleteAllEntries(): Promise<void> {
  const db = getDatabase();
  const rows = await db.getAllAsync<Row>('SELECT * FROM entries WHERE audio_file IS NOT NULL');
  await db.runAsync('DELETE FROM entries');
  await Promise.all(rows.map((r) => (r.audio_file ? deleteRecording(r.audio_file) : undefined)));
}
