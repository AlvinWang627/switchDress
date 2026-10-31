import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { ImageRecord } from '@/types/popup';

const makeRecord = (id: string, extra: Partial<ImageRecord> = {}): ImageRecord => ({
  id,
  blob: new Blob(['img'], { type: 'image/png' }),
  timestamp: 1000,
  ...extra,
});

describe('imageService', () => {
  let svc: typeof import('@/services/imageService');

  beforeEach(async () => {
    vi.resetModules();
    globalThis.indexedDB = new IDBFactory();
    svc = await import('@/services/imageService');
  });

  it('初始為空', async () => {
    expect(await svc.getAllImages()).toEqual([]);
  });

  it('saveImage 後可用 getImage 取回', async () => {
    await svc.saveImage(makeRecord('a'));
    const got = await svc.getImage('a');
    expect(got?.id).toBe('a');
    expect(got?.timestamp).toBe(1000);
  });

  it('getImage 找不到時回傳 undefined', async () => {
    expect(await svc.getImage('missing')).toBeUndefined();
  });

  it('相同 id 再次儲存會覆蓋（put 語意）', async () => {
    await svc.saveImage(makeRecord('a', { timestamp: 1 }));
    await svc.saveImage(makeRecord('a', { timestamp: 2 }));
    const all = await svc.getAllImages();
    expect(all).toHaveLength(1);
    expect(all[0].timestamp).toBe(2);
  });

  it('getAllImages 回傳全部紀錄', async () => {
    await svc.saveImage(makeRecord('a'));
    await svc.saveImage(makeRecord('b'));
    expect((await svc.getAllImages()).map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  it('deleteImage 只刪除指定紀錄', async () => {
    await svc.saveImage(makeRecord('a'));
    await svc.saveImage(makeRecord('b'));
    await svc.deleteImage('a');
    expect((await svc.getAllImages()).map((r) => r.id)).toEqual(['b']);
  });

  it('clearAllImages 清空全部', async () => {
    await svc.saveImage(makeRecord('a'));
    await svc.saveImage(makeRecord('b'));
    await svc.clearAllImages();
    expect(await svc.getAllImages()).toEqual([]);
  });

  it('imageService 物件暴露全部方法', () => {
    expect(Object.keys(svc.imageService).sort()).toEqual(
      ['clearAllImages', 'deleteImage', 'getAllImages', 'getImage', 'saveImage'].sort()
    );
  });
});
