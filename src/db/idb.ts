/**
 * Tiny IndexedDB helper for the web build. Two object stores:
 * - `entries`: diary entries, keyed by `id`
 * - `recordings`: voice-note Blobs, keyed by their id
 * Everything stays in this browser's storage; nothing is sent anywhere.
 */
const DB_NAME = 'booklet';
const DB_VERSION = 1;

export type StoreName = 'entries' | 'recordings';

let opening: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  opening.catch(() => {
    opening = null;
  });
  return opening;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(name, mode);
  const result = await request(fn(tx.objectStore(name)));
  if (mode === 'readwrite') {
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  return result;
}

export function idbGet<T>(name: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return withStore(name, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
}

export function idbGetAll<T>(name: StoreName): Promise<T[]> {
  return withStore(name, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

/** `key` is required for out-of-line stores (`recordings`), omitted for `entries`. */
export async function idbPut(name: StoreName, value: unknown, key?: IDBValidKey): Promise<void> {
  await withStore(name, 'readwrite', (s) => (key === undefined ? s.put(value) : s.put(value, key)));
}

export async function idbDelete(name: StoreName, key: IDBValidKey): Promise<void> {
  await withStore(name, 'readwrite', (s) => s.delete(key));
}

export async function idbClear(name: StoreName): Promise<void> {
  await withStore(name, 'readwrite', (s) => s.clear());
}
