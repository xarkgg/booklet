import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as db from '../db/entries';
import type { Entry, NewEntry } from '../db/types';

type EntriesContextValue = {
  entries: Entry[];
  ready: boolean;
  add: (input: NewEntry, id?: string) => Promise<Entry>;
  updateText: (id: string, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    setEntries(await db.listEntries());
  }, []);

  useEffect(() => {
    reload()
      .catch((e: unknown) => console.warn('Could not read entries', e))
      .finally(() => setReady(true));
  }, [reload]);

  const add = useCallback(
    async (input: NewEntry, id?: string) => {
      const entry = await db.createEntry(input, id);
      await reload();
      return entry;
    },
    [reload],
  );

  const updateText = useCallback(
    async (id: string, text: string) => {
      await db.updateEntryText(id, text);
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await db.deleteEntry(id);
      await reload();
    },
    [reload],
  );

  const removeAll = useCallback(async () => {
    await db.deleteAllEntries();
    await reload();
  }, [reload]);

  const value = useMemo(
    () => ({ entries, ready, add, updateText, remove, removeAll }),
    [entries, ready, add, updateText, remove, removeAll],
  );
  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries(): EntriesContextValue {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used inside EntriesProvider');
  return ctx;
}
