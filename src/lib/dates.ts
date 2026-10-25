const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** Short labels as used in the week strip (Mon-first, "Thur" like the design). */
export const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];

/** A calendar day as `YYYY-MM-DD` in the device's local time zone. */
export type DayKey = string;

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function toDayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

/** "Wednesday, 28 May" */
export function formatShort(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Tuesday, 27 May 2025" */
export function formatLong(key: DayKey): string {
  const d = fromDayKey(key);
  return `${formatShort(d)} ${d.getFullYear()}`;
}

/** "May 2025" */
export function formatMonth(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Monday of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (r.getDay() + 6) % 7;
  return addDays(r, -offset);
}

export function weekOf(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Weeks (Mon-first rows) covering the given month. */
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const rows: Date[][] = [];
  let cursor = startOfWeek(first);
  do {
    rows.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  } while (cursor.getMonth() === month);
  return rows;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${pad(s)}`;
}
