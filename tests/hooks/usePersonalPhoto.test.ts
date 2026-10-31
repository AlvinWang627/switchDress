import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { PersonalPhoto } from '@/types';

const photoServiceMock = vi.hoisted(() => ({ getPhotos: vi.fn() }));
vi.mock('@/services/photoService', () => photoServiceMock);

import { usePersonalPhoto } from '@/hooks/usePersonalPhoto';

const photo = (id: string): PersonalPhoto => ({
  id,
  blob: new Blob([id]),
  name: `${id}.png`,
  type: 'image/png',
  uploadedAt: 1,
});

describe('usePersonalPhoto', () => {
  beforeEach(() => {
    photoServiceMock.getPhotos.mockReset().mockResolvedValue([]);
  });

  it('載入中 isLoading 為 true，完成後為 false', async () => {
    const { result } = renderHook(() => usePersonalPhoto());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.photos).toEqual([]);
    expect(result.current.selectedPhoto).toBeNull();
  });

  it('只有一張照片時自動選取', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('only')]);

    const { result } = renderHook(() => usePersonalPhoto());

    await waitFor(() => expect(result.current.selectedPhoto?.id).toBe('only'));
  });

  it('有多張照片時不自動選取', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b')]);

    const { result } = renderHook(() => usePersonalPhoto());
    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    expect(result.current.selectedPhoto).toBeNull();
  });

  it('selectPhoto 選取指定照片，且可改選其他張', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b')]);
    const { result } = renderHook(() => usePersonalPhoto());
    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    act(() => result.current.selectPhoto('b'));
    await waitFor(() => expect(result.current.selectedPhoto?.id).toBe('b'));

    act(() => result.current.selectPhoto('a'));
    await waitFor(() => expect(result.current.selectedPhoto?.id).toBe('a'));
  });

  it('選取的 id 不存在於列表時 selectedPhoto 為 null', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b')]);
    const { result } = renderHook(() => usePersonalPhoto());
    await waitFor(() => expect(result.current.photos).toHaveLength(2));

    act(() => result.current.selectPhoto('ghost'));
    await waitFor(() => expect(photoServiceMock.getPhotos.mock.calls.length).toBeGreaterThan(1));

    expect(result.current.selectedPhoto).toBeNull();
  });

  it('refresh 重新讀取照片列表', async () => {
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b')]);
    const { result } = renderHook(() => usePersonalPhoto());
    await waitFor(() => expect(result.current.photos).toHaveLength(2));
    photoServiceMock.getPhotos.mockResolvedValue([photo('a'), photo('b'), photo('c')]);

    await act(() => result.current.refresh());

    expect(result.current.photos).toHaveLength(3);
  });

  it('載入失敗時保留 Error 訊息', async () => {
    photoServiceMock.getPhotos.mockRejectedValue(new Error('idb down'));

    const { result } = renderHook(() => usePersonalPhoto());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('idb down');
  });

  it('載入失敗且非 Error 時使用預設訊息', async () => {
    photoServiceMock.getPhotos.mockRejectedValue('x');

    const { result } = renderHook(() => usePersonalPhoto());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('載入個人照片失敗');
  });
});
