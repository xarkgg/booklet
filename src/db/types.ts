import type { DayKey } from '../lib/dates';

export type Entry = {
  id: string;
  /** The day the entry belongs to, `YYYY-MM-DD` local time. */
  date: DayKey;
  text: string;
  /** Playable URI of the voice note (`file://` on native, `blob:` on web), if the entry has one. */
  audioUri: string | null;
  /** Length of the voice note in milliseconds. */
  audioDurationMs: number | null;
  createdAt: number;
  updatedAt: number;
};

export type NewEntry = {
  date: DayKey;
  text: string;
  audioFile?: string | null;
  audioDurationMs?: number | null;
};
