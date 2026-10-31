import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

const makeBlob = (type = 'image/png') => new Blob(['x'], { type });

describe('photoService', () => {
  let svc: typeof import('@/services/photoService');

  beforeEach(async () => {
    // 每個測試使用全新的 IndexedDB 與模組狀態
    vi.resetModules();
    globalThis.indexedDB = new IDBFactory();
    svc = await import('@/services/photoService');
  });

  it('初始沒有照片', async () => {
    expect(await svc.getPhotos()).toEqual([]);
    expect(await svc.getPhotoCount()).toBe(0);
  });

  it('savePhoto 回傳完整紀錄並可被讀回', async () => {
    const before = Date.now();
    const photo = await svc.savePhoto(makeBlob('image/jpeg'), 'me.jpg');

    expect(photo.id).toBeTruthy();
    expect(photo.name).toBe('me.jpg');
    expect(photo.type).toBe('image/jpeg');
    expect(photo.uploadedAt).toBeGreaterThanOrEqual(before);

    const photos = await svc.getPhotos();
    expect(photos).toHaveLength(1);
    expect(photos[0].id).toBe(photo.id);
    expect(photos[0].name).toBe('me.jpg');
  });

  it('每張照片有不同的 id', async () => {
    const a = await svc.savePhoto(makeBlob(), 'a.png');
    const b = await svc.savePhoto(makeBlob(), 'b.png');
    expect(a.id).not.toBe(b.id);
  });

  it('最多 3 張，第 4 張拋出錯誤且不寫入', async () => {
    await svc.savePhoto(makeBlob(), '1.png');
    await svc.savePhoto(makeBlob(), '2.png');
    await svc.savePhoto(makeBlob(), '3.png');

    await expect(svc.savePhoto(makeBlob(), '4.png')).rejects.toThrow('已達照片數量上限（3 張）');
    expect(await svc.getPhotoCount()).toBe(3);
  });

  it('deletePhoto 移除指定照片並釋出名額', async () => {
    const a = await svc.savePhoto(makeBlob(), 'a.png');
    await svc.savePhoto(makeBlob(), 'b.png');
    await svc.savePhoto(makeBlob(), 'c.png');

    await svc.deletePhoto(a.id);

    expect(await svc.getPhotoCount()).toBe(2);
    expect((await svc.getPhotos()).map((p) => p.name).sort()).toEqual(['b.png', 'c.png']);
    await expect(svc.savePhoto(makeBlob(), 'd.png')).resolves.toBeDefined();
  });

  it('刪除不存在的 id 不會拋錯', async () => {
    await expect(svc.deletePhoto('nope')).resolves.toBeUndefined();
  });
});
