import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { ImageRecord } from '@/types/popup';

interface SwitchDressDB extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
  };
}

const DB_CONFIG = {
  name: 'switch-dress-db',
  version: 1,
  storeName: 'images' as const,
};

let dbInstance: IDBPDatabase<SwitchDressDB> | null = null;

async function getDB(): Promise<IDBPDatabase<SwitchDressDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SwitchDressDB>(DB_CONFIG.name, DB_CONFIG.version, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
        db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function saveImage(record: ImageRecord): Promise<void> {
  const db = await getDB();
  await db.put(DB_CONFIG.storeName, record);
}

export async function getImage(id: string): Promise<ImageRecord | undefined> {
  const db = await getDB();
  return db.get(DB_CONFIG.storeName, id);
}

export async function getAllImages(): Promise<ImageRecord[]> {
  const db = await getDB();
  return db.getAll(DB_CONFIG.storeName);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DB_CONFIG.storeName, id);
}

export async function clearAllImages(): Promise<void> {
  const db = await getDB();
  await db.clear(DB_CONFIG.storeName);
}

export async function updateImage(
  id: string,
  updates: Partial<ImageRecord>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get(DB_CONFIG.storeName, id);
  if (existing) {
    await db.put(DB_CONFIG.storeName, { ...existing, ...updates });
  }
}

export async function getAllImagesSorted(): Promise<ImageRecord[]> {
  const db = await getDB();
  const images = await db.getAll(DB_CONFIG.storeName);
  return images.sort((a, b) => b.timestamp - a.timestamp);
}

export const imageService = {
  saveImage,
  getImage,
  getAllImages,
  deleteImage,
  clearAllImages,
  updateImage,
  getAllImagesSorted,
};
