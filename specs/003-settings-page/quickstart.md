# Quickstart: 003-settings-page

**Branch**: `003-settings-page` | **Date**: 2026-04-25

## 新增功能快速參考

### 1. 儲存模型設定

```typescript
// services/settingsService.ts
import { chromeStoragePromise } from '@/services/chromeStorage';

interface UserSettings {
  model: string;
  apiKey: string;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const storage = await chromeStoragePromise;
  await storage.set({ 'user-settings': settings });
}

export async function loadSettings(): Promise<UserSettings | null> {
  const storage = await chromeStoragePromise;
  const result = await storage.get('user-settings');
  return result['user-settings'] ?? null;
}
```

### 2. 上傳個人照片

```typescript
// services/photoService.ts
import { openDB, type IDBPDatabase } from 'idb';

interface PhotoRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  uploadedAt: number;
}

const DB_NAME = 'switchdress-photos';
const STORE_NAME = 'photos';
const MAX_PHOTOS = 3;

export async function savePhoto(blob: Blob, name: string): Promise<PhotoRecord> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database: IDBPDatabase) {
      database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    },
  });

  const count = await db.count(STORE_NAME);
  if (count >= MAX_PHOTOS) {
    throw new Error('已達照片數量上限（3 張）');
  }

  const record: PhotoRecord = {
    id: crypto.randomUUID(),
    blob,
    name,
    type: blob.type,
    uploadedAt: Date.now(),
  };

  await db.add(STORE_NAME, record);
  return record;
}

export async function getPhotos(): Promise<PhotoRecord[]> {
  const db = await openDB(DB_NAME, 1);
  return db.getAll(STORE_NAME);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB(DB_NAME, 1);
  await db.delete(STORE_NAME, id);
}
```

### 3. 驗證圖片格式與大小

```typescript
// utils/validation.ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validatePhoto(blob: Blob): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(blob.type)) {
    return { valid: false, error: '僅支援 JPEG 和 PNG 格式' };
  }
  if (blob.size > MAX_SIZE) {
    return { valid: false, error: '圖片大小不可超過 5MB' };
  }
  return { valid: true };
}
```

### 4. 設定頁面主要元件

```tsx
// options/components/SettingsPage.tsx
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { saveSettings, loadSettings } from '@/services/settingsService';
import { savePhoto, getPhotos, deletePhoto } from '@/services/photoService';
import { validatePhoto } from '@/utils/validation';

// 子元件：PhotoSlot
// 子元件：ModelSelector
// 子元件：ApiKeyInput
```

---

## 測試起點

```bash
# 執行現有測試
npm test

# 開發模式
npm run dev
```

---

## 相關檔案

- `src/options/index.tsx` — 設定頁面入口
- `src/services/settingsService.ts` — 模型設定儲存服務
- `src/services/photoService.ts` — 照片儲存服務
- `src/hooks/useSettings.ts` — 設定 hook
- `src/hooks/usePhotos.ts` — 照片 hook
