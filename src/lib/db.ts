import type { Progress } from './types';

/**
 * 軽量な IndexedDB ラッパー。外部依存なしで progress ストアを扱う。
 * ストア: 'progress' (keyPath: cardId)
 */

const DB_NAME = 'english-pwa';
const DB_VERSION = 1;
const STORE = 'progress';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'cardId' });
        store.createIndex('due', 'due', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export async function getProgress(cardId: string): Promise<Progress | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').get(cardId);
    req.onsuccess = () => resolve(req.result as Progress | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllProgress(): Promise<Progress[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result as Progress[]);
    req.onerror = () => reject(req.error);
  });
}

export async function putProgress(p: Progress): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(p);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearProgress(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
