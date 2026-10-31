import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { PersonalPhoto } from '@/types';

const usePhotosMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/usePhotos', () => ({ usePhotos: usePhotosMock }));

import { PhotosSection } from '@/options/components/PhotosSection';

const photo = (id: string): PersonalPhoto => ({
  id,
  blob: new Blob(['x'], { type: 'image/png' }),
  name: `${id}.png`,
  type: 'image/png',
  uploadedAt: 1,
});

const hookState = (overrides: Record<string, unknown> = {}) => ({
  photos: [] as PersonalPhoto[],
  isLoading: false,
  error: null,
  savePhoto: vi.fn().mockResolvedValue(undefined),
  deletePhoto: vi.fn().mockResolvedValue(undefined),
  canAddMore: true,
  photoCount: 0,
  ...overrides,
});

const upload = (file: File) =>
  fireEvent.change(screen.getByLabelText('上傳照片'), { target: { files: [file] } });

describe('PhotosSection', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('載入中顯示骨架畫面，不顯示標題', () => {
    usePhotosMock.mockReturnValue(hookState({ isLoading: true }));
    render(<PhotosSection />);

    expect(screen.queryByText('個人照片')).not.toBeInTheDocument();
  });

  it('顯示標題、張數與三個插槽', () => {
    usePhotosMock.mockReturnValue(hookState({ photos: [photo('a')], photoCount: 1 }));
    render(<PhotosSection />);

    expect(screen.getByText('個人照片')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1); // 其餘兩格是空插槽
    expect(screen.getAllByTestId('icon').filter((i) => i.dataset.icon === 'mdi:image-plus')).toHaveLength(2);
  });

  it('可新增時顯示上傳按鈕', () => {
    usePhotosMock.mockReturnValue(hookState());
    render(<PhotosSection />);

    expect(screen.getByRole('button', { name: /上傳照片/ })).toBeInTheDocument();
  });

  it('達到上限時改顯示提示、不顯示上傳按鈕', () => {
    usePhotosMock.mockReturnValue(
      hookState({ photos: [photo('a'), photo('b'), photo('c')], canAddMore: false, photoCount: 3 })
    );
    render(<PhotosSection />);

    expect(screen.getByText('已達照片數量上限（3 張）')).toBeInTheDocument();
    expect(screen.queryByLabelText('上傳照片')).not.toBeInTheDocument();
  });

  describe('上傳', () => {
    it('有效檔案：儲存並顯示成功提示，呼叫 onUploadSuccess', async () => {
      const state = hookState();
      usePhotosMock.mockReturnValue(state);
      const onUploadSuccess = vi.fn();
      render(<PhotosSection onUploadSuccess={onUploadSuccess} />);

      upload(new File(['abc'], 'me.png', { type: 'image/png' }));

      expect(await screen.findByText('照片上傳成功')).toBeInTheDocument();
      expect(state.savePhoto).toHaveBeenCalledTimes(1);
      const [savedBlob, savedName] = state.savePhoto.mock.calls[0];
      expect(savedBlob.type).toBe('image/png');
      expect(savedName).toBe('me.png');
      expect(onUploadSuccess).toHaveBeenCalled();
    });

    it('格式不支援：顯示錯誤、不儲存、呼叫 onUploadError', async () => {
      const state = hookState();
      usePhotosMock.mockReturnValue(state);
      const onUploadError = vi.fn();
      render(<PhotosSection onUploadError={onUploadError} />);

      upload(new File(['abc'], 'a.gif', { type: 'image/gif' }));

      expect(await screen.findByText('僅支援 JPEG 和 PNG 格式')).toBeInTheDocument();
      expect(state.savePhoto).not.toHaveBeenCalled();
      expect(onUploadError).toHaveBeenCalledWith(expect.objectContaining({ message: '僅支援 JPEG 和 PNG 格式' }));
    });

    it('檔案過大：顯示錯誤、不儲存', async () => {
      const state = hookState();
      usePhotosMock.mockReturnValue(state);
      render(<PhotosSection />);

      upload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));

      expect(await screen.findByText('圖片大小不可超過 5MB')).toBeInTheDocument();
      expect(state.savePhoto).not.toHaveBeenCalled();
    });

    it('儲存失敗：顯示該錯誤訊息並呼叫 onUploadError', async () => {
      const state = hookState({ savePhoto: vi.fn().mockRejectedValue(new Error('已達照片數量上限（3 張）')) });
      usePhotosMock.mockReturnValue(state);
      const onUploadError = vi.fn();
      render(<PhotosSection onUploadError={onUploadError} />);

      upload(new File(['abc'], 'me.png', { type: 'image/png' }));

      expect(await screen.findByText('已達照片數量上限（3 張）', { selector: 'div' })).toBeInTheDocument();
      expect(onUploadError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('儲存失敗且不是 Error 時顯示「上傳失敗」', async () => {
      usePhotosMock.mockReturnValue(hookState({ savePhoto: vi.fn().mockRejectedValue('x') }));
      render(<PhotosSection />);

      upload(new File(['abc'], 'me.png', { type: 'image/png' }));

      expect(await screen.findByText('上傳失敗')).toBeInTheDocument();
    });

    it('提示在 3 秒後消失', async () => {
      usePhotosMock.mockReturnValue(hookState());
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      render(<PhotosSection />);

      upload(new File(['abc'], 'me.png', { type: 'image/png' }));
      await screen.findByText('照片上傳成功');

      const hide = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 3000)?.[0] as () => void;
      expect(hide).toBeTypeOf('function');
      act(() => hide());

      expect(screen.queryByText('照片上傳成功')).not.toBeInTheDocument();
    });
  });

  describe('刪除', () => {
    it('成功：呼叫 deletePhoto 並顯示提示', async () => {
      const state = hookState({ photos: [photo('a')], photoCount: 1 });
      usePhotosMock.mockReturnValue(state);
      render(<PhotosSection />);

      fireEvent.click(screen.getByLabelText('刪除照片'));

      expect(await screen.findByText('照片已刪除')).toBeInTheDocument();
      expect(state.deletePhoto).toHaveBeenCalledWith('a');
    });

    it('失敗：顯示「刪除失敗」', async () => {
      usePhotosMock.mockReturnValue(
        hookState({
          photos: [photo('a')],
          photoCount: 1,
          deletePhoto: vi.fn().mockRejectedValue(new Error('x')),
        })
      );
      render(<PhotosSection />);

      fireEvent.click(screen.getByLabelText('刪除照片'));

      await waitFor(() => expect(screen.getByText('刪除失敗')).toBeInTheDocument());
    });
  });
});
