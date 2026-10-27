import type { Item } from './types';

const DB_NAME = 'mediatheque-psy';
const DB_VERSION = 1;
let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAllItems(): Promise<Item[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction('items').objectStore('items').getAll();
    req.onsuccess = () => resolve(req.result as Item[]);
    req.onerror = () => reject(req.error);
  });
}

export async function putItems(items: Item[]): Promise<void> {
  const db = await open();
  const tx = db.transaction('items', 'readwrite');
  items.forEach((i) => tx.objectStore('items').put(i));
  await done(tx);
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const db = await open();
  return new Promise((resolve) => {
    const req = db.transaction('meta').objectStore('meta').get(key);
    req.onsuccess = () => resolve((req.result as T) ?? fallback);
    req.onerror = () => resolve(fallback);
  });
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await open();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put(value, key);
  await done(tx);
}

/** Demande au navigateur de ne pas purger le stockage (utile sur iPhone). Sans effet si refusé. */
export async function askPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
