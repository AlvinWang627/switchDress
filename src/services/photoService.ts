import { openDB, type IDBPDatabase } from 'idb';
import type { PersonalPhoto } from '@/types';

interface SwitchDressPhotosDB {
  photos: {
    key: string;
    value: PersonalPhoto;
  };
}

const DB_NAME = 'switchdress-photos';
const STORE_NAME = 'photos';
const MAX_PHOTOS = 3;

let dbInstance: IDBPDatabase<SwitchDressPhotosDB> | null = null;

async function getDB(): Promise<IDBPDatabase<SwitchDressPhotosDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SwitchDressPhotosDB>(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function savePhoto(blob: Blob, name: string): Promise<PersonalPhoto> {
  const db = await getDB();

  const count = await db.count(STORE_NAME);
  if (count >= MAX_PHOTOS) {
    throw new Error('已達照片數量上限（3 張）');
  }

  const record: PersonalPhoto = {
    id: crypto.randomUUID(),
    blob,
    name,
    type: blob.type,
    uploadedAt: Date.now(),
  };

  await db.add(STORE_NAME, record);
  return record;
}

export async function getPhotos(): Promise<PersonalPhoto[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function getPhotoCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
