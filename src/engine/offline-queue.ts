// engine/offline-queue.ts — IndexedDB queue for offline mutations
// Pure logic: no React, no Supabase imports.

export type QueueAction = 'create' | 'update' | 'complete' | 'uncomplete' | 'delete';

export interface QueueEntry {
  id: number; // auto-incremented IndexedDB key
  action: QueueAction;
  itemId: string | null; // null for 'create' (temp id in payload)
  payload: Record<string, unknown>;
  timestamp: string; // ISO — used for last-write-wins
  retries: number;
}

const DB_NAME = 'mindroot-offline';
const DB_VERSION = 1;
const STORE_NAME = 'queue';
const MAX_RETRIES = 5;

// ─── IndexedDB helpers ──────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

// ─── Queue operations ───────────────────────────────────────

export async function enqueue(
  action: QueueAction,
  itemId: string | null,
  payload: Record<string, unknown> = {},
): Promise<number> {
  const db = await openDB();
  const entry: Omit<QueueEntry, 'id'> = {
    action,
    itemId,
    payload,
    timestamp: new Date().toISOString(),
    retries: 0,
  };
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').add(entry);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function dequeue(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEntries(): Promise<QueueEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result as QueueEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function incrementRetry(id: number): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const entry = getReq.result as QueueEntry | undefined;
      if (!entry) { resolve(); return; }
      entry.retries += 1;
      const putReq = store.put(entry);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function pendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Conflict resolution ────────────────────────────────────

/**
 * Last-write-wins by updated_at.
 * Returns true if the queued entry should overwrite the server version.
 */
export function shouldOverwrite(
  queueTimestamp: string,
  serverUpdatedAt: string | null,
): boolean {
  if (!serverUpdatedAt) return true;
  return new Date(queueTimestamp).getTime() >= new Date(serverUpdatedAt).getTime();
}

// ─── Compaction ─────────────────────────────────────────────

/**
 * Compact queue: collapse multiple operations on the same itemId.
 * - If last action is 'delete', keep only the delete.
 * - Multiple updates → keep only the last one (merged payload).
 * - create + updates → merge into single create.
 * - create + delete → remove both.
 */
export function compactQueue(entries: QueueEntry[]): QueueEntry[] {
  const byItem = new Map<string, QueueEntry[]>();
  const noItem: QueueEntry[] = [];

  for (const entry of entries) {
    const key = entry.itemId ?? `__create_${entry.id}`;
    if (!entry.itemId && entry.action === 'create') {
      noItem.push(entry);
      continue;
    }
    const list = byItem.get(key) || [];
    list.push(entry);
    byItem.set(key, list);
  }

  const result: QueueEntry[] = [...noItem];

  for (const [, group] of byItem) {
    const sorted = group.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const last = sorted[sorted.length - 1];

    if (last.action === 'delete') {
      // If there's a create in the group, skip everything (created+deleted offline)
      const hasCreate = sorted.some((e) => e.action === 'create');
      if (!hasCreate) {
        result.push(last);
      }
      continue;
    }

    // Merge all update payloads into one
    const merged: Record<string, unknown> = {};
    for (const entry of sorted) {
      Object.assign(merged, entry.payload);
    }
    result.push({ ...last, payload: merged });
  }

  return result.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export { MAX_RETRIES };
