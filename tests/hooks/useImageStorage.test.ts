import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ImageRecord } from '@/types/popup';

const imageServiceMock = vi.hoisted(() => ({
  getAllImages: vi.fn(),
  saveImage: vi.fn(),
  deleteImage: vi.fn(),
}));
vi.mock('@/services/imageService', () => ({ imageService: imageServiceMock }));

import { useImageStorage } from '@/hooks/useImageStorage';

const record = (id: string): ImageRecord => ({ id, blob: new Blob(['x']), timestamp: 1 });

describe('useImageStorage', () => {
  beforeEach(() => {
    imageServiceMock.getAllImages.mockReset().mockResolvedValue([]);
    imageServiceMock.saveImage.mockReset().mockResolvedValue(undefined);
    imageServiceMock.deleteImage.mockReset().mockResolvedValue(undefined);
  });

  it('掛載時載入所有圖片', async () => {
    imageServiceMock.getAllImages.mockResolvedValue([record('a')]);

    const { result } = renderHook(() => useImageStorage());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.images).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('載入失敗時設定 error（Error 實例保留訊息）', async () => {
    imageServiceMock.getAllImages.mockRejectedValue(new Error('nope'));

    const { result } = renderHook(() => useImageStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('nope');
  });

  it('載入失敗且非 Error 時使用預設訊息', async () => {
    imageServiceMock.getAllImages.mockRejectedValue('x');

    const { result } = renderHook(() => useImageStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Failed to load images');
  });

  it('saveImage 建立含 uuid 的紀錄、儲存並重新整理', async () => {
    const { result } = renderHook(() => useImageStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const blob = new Blob(['x']);
    const thumbnail = new Blob(['t']);
    imageServiceMock.getAllImages.mockResolvedValue([record('new')]);

    await act(() => result.current.saveImage(blob, thumbnail));

    const saved = imageServiceMock.saveImage.mock.calls[0][0] as ImageRecord;
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.blob).toBe(blob);
    expect(saved.thumbnail).toBe(thumbnail);
    expect(result.current.images).toHaveLength(1);
  });

  it('saveImage 失敗時設定 error 並重新拋出', async () => {
    imageServiceMock.saveImage.mockRejectedValue(new Error('quota'));
    const { result } = renderHook(() => useImageStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveImage(new Blob(['x']))).rejects.toThrow('quota');
    });

    expect(result.current.error?.message).toBe('quota');
  });

  it('deleteImage 刪除後重新整理', async () => {
    imageServiceMock.getAllImages.mockResolvedValue([record('a')]);
    const { result } = renderHook(() => useImageStorage());
    await waitFor(() => expect(result.current.images).toHaveLength(1));
    imageServiceMock.getAllImages.mockResolvedValue([]);

    await act(() => result.current.deleteImage('a'));

    expect(imageServiceMock.deleteImage).toHaveBeenCalledWith('a');
    expect(result.current.images).toHaveLength(0);
  });

  it('deleteImage 失敗時設定 error 並重新拋出', async () => {
    imageServiceMock.deleteImage.mockRejectedValue('x');
    const { result } = renderHook(() => useImageStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.deleteImage('a')).rejects.toBe('x');
    });

    expect(result.current.error?.message).toBe('Failed to delete image');
  });
});
