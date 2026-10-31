import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { PersonalPhoto } from '@/types';

const photoServiceMock = vi.hoisted(() => ({
  savePhoto: vi.fn(),
  getPhotos: vi.fn(),
  deletePhoto: vi.fn(),
  getPhotoCount: vi.fn(),
}));
vi.mock('@/services/photoService', () => photoServiceMock);

import { usePhotos } from '@/hooks/usePhotos';

const photo = (id: string): PersonalPhoto => ({
  id,
  blob: new Blob(['x']),
  name: `${id}.png`,
  type: 'image/png',
  uploadedAt: 1,
});

describe('usePhotos', () => {
  beforeEach(() => {
    photoServiceMock.savePhoto.mockReset().mockResolvedValue(undefined);
    photoServiceMock.deletePhoto.mockReset().mockResolvedValue(undefined);
    photoServiceMock.getPhotos.mockReset().mockResolvedValue([]);
    photoServiceMock.getPhotoCount.mockReset().mockResolvedValue(0);
  });

  it('載入既有照片與數量', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b')]);
    photoServiceMock.getPhotoCount.mockResolvedValue(2);

    const { result } = renderHook(() => usePhotos());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.photos).toHaveLength(2);
    expect(result.current.photoCount).toBe(2);
    expect(result.current.canAddMore).toBe(true);
  });

  it('達到 3 張時 canAddMore 為 false', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b'), photo('c')]);
    photoServiceMock.getPhotoCount.mockResolvedValue(3);

    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canAddMore).toBe(false);
  });

  it('載入失敗時設定 error', async () => {
    photoServiceMock.getPhotos.mockRejectedValue(new Error('idb'));

    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('idb');
  });

  it('savePhoto 呼叫服務後重新載入列表', async () => {
    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    photoServiceMock.getPhotos.mockResolvedValue([photo('a')]);
    photoServiceMock.getPhotoCount.mockResolvedValue(1);
    const blob = new Blob(['x']);

    await act(() => result.current.savePhoto(blob, 'a.png'));

    expect(photoServiceMock.savePhoto).toHaveBeenCalledWith(blob, 'a.png');
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photoCount).toBe(1);
  });

  it('savePhoto 失敗時設定 error 並重新拋出', async () => {
    photoServiceMock.savePhoto.mockRejectedValue(new Error('已達照片數量上限（3 張）'));
    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.savePhoto(new Blob(['x']), 'a.png')).rejects.toThrow('已達照片數量上限');
    });

    expect(result.current.error?.message).toBe('已達照片數量上限（3 張）');
  });

  it('deletePhoto 呼叫服務後重新載入列表', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a')]);
    photoServiceMock.getPhotoCount.mockResolvedValue(1);
    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.photos).toHaveLength(1));
    photoServiceMock.getPhotos.mockResolvedValue([]);
    photoServiceMock.getPhotoCount.mockResolvedValue(0);

    await act(() => result.current.deletePhoto('a'));

    expect(photoServiceMock.deletePhoto).toHaveBeenCalledWith('a');
    expect(result.current.photos).toHaveLength(0);
  });

  it('deletePhoto 失敗時設定 error 並重新拋出', async () => {
    photoServiceMock.deletePhoto.mockRejectedValue('x');
    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.deletePhoto('a')).rejects.toBe('x');
    });

    expect(result.current.error?.message).toBe('刪除照片失敗');
  });
});
