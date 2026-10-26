import { idbClear, idbDelete, idbGet, idbGetAll, idbPut } from './idb';
import type { Entry, NewEntry } from './types';
import { recordingUri, deleteRecording } from '../audio/storage';

/** Same API as entries.ts, backed by IndexedDB in the browser. */

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
  let audioUri: string | null = null;
  if (row.audio_file) {
    try {
      audioUri = await recordingUri(row.audio_file);
    } catch {
      audioUri = null;
    }
  }
  return {
    id: row.id,
    date: row.date,
    text: row.text,
    audioUri,
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
  const rows = await idbGetAll<Row>('entries');
  rows.sort((a, b) => (a.date === b.date ? b.created_at - a.created_at : a.date < b.date ? 1 : -1));
  return Promise.all(rows.map(toEntry));
}

export async function createEntry(input: NewEntry, id: string = newId()): Promise<Entry> {
  const now = Date.now();
  const row: Row = {
    id,
    date: input.date,
    text: input.text,
    audio_file: input.audioFile ?? null,
    audio_duration_ms: input.audioDurationMs ?? null,
    created_at: now,
    updated_at: now,
  };
  await idbPut('entries', row);
  return toEntry(row);
}

export async function updateEntryText(id: string, text: string): Promise<void> {
  const row = await idbGet<Row>('entries', id);
  if (!row) return;
  await idbPut('entries', { ...row, text, updated_at: Date.now() });
}

export async function deleteEntry(id: string): Promise<void> {
  const row = await idbGet<Row>('entries', id);
  await idbDelete('entries', id);
  if (row?.audio_file) await deleteRecording(row.audio_file);
}

export async function deleteAllEntries(): Promise<void> {
  const rows = await idbGetAll<Row>('entries');
  await idbClear('entries');
  await Promise.all(rows.map((r) => (r.audio_file ? deleteRecording(r.audio_file) : undefined)));
  await idbClear('recordings');
}
