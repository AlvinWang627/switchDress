import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ImageRecord } from '@/types/popup';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';

const imageServiceMock = vi.hoisted(() => ({
  getAllImagesSorted: vi.fn(),
  deleteImage: vi.fn(),
  updateImage: vi.fn(),
}));
vi.mock('@/services/imageService', () => ({ imageService: imageServiceMock }));
vi.mock('@/gallery/index.css?inline', () => ({ default: '' }));

import GalleryPage from '@/gallery/index';

const image = (id: string, isFavorite = false): ImageRecord => ({
  id,
  blob: new Blob([id]),
  timestamp: 1,
  isFavorite,
});

const items = () => screen.queryAllByAltText('Gallery item');

describe('GalleryPage', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:g');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    imageServiceMock.getAllImagesSorted.mockReset().mockResolvedValue([image('a'), image('b', true)]);
    imageServiceMock.deleteImage.mockReset().mockResolvedValue(undefined);
    imageServiceMock.updateImage.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    uninstallChromeMock();
  });

  describe('載入', () => {
    it('載入中顯示提示，完成後顯示相片', async () => {
      render(<GalleryPage />);
      expect(screen.getByText('載入中...')).toBeInTheDocument();

      await waitFor(() => expect(items()).toHaveLength(2));
      expect(screen.queryByText('載入中...')).not.toBeInTheDocument();
      expect(imageServiceMock.getAllImagesSorted).toHaveBeenCalledTimes(1);
    });

    it('沒有相片時顯示空狀態', async () => {
      imageServiceMock.getAllImagesSorted.mockResolvedValue([]);
      render(<GalleryPage />);

      expect(await screen.findByText('尚無合成照片')).toBeInTheDocument();
    });

    it('載入失敗時記錄錯誤並結束載入狀態', async () => {
      imageServiceMock.getAllImagesSorted.mockRejectedValue(new Error('idb'));
      render(<GalleryPage />);

      expect(await screen.findByText('尚無合成照片')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Failed to load images:', expect.any(Error));
    });
  });

  describe('標題列', () => {
    it('顯示標題「相片集」', async () => {
      render(<GalleryPage />);
      expect(screen.getByRole('heading', { level: 1, name: '相片集' })).toBeInTheDocument();
      await waitFor(() => expect(items()).toHaveLength(2));
    });

    it('擴充環境：返回鈕關閉目前分頁', async () => {
      const { chrome } = installChromeMock();
      Object.assign(chrome.runtime, { id: 'ext' });
      const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getByLabelText('返回'));

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('非擴充環境：返回鈕回到上一頁', async () => {
      uninstallChromeMock();
      const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getByLabelText('返回'));

      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('刪除', () => {
    it('成功：呼叫 deleteImage 並從畫面移除該張', async () => {
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getAllByLabelText('刪除')[0]);

      await waitFor(() => expect(items()).toHaveLength(1));
      expect(imageServiceMock.deleteImage).toHaveBeenCalledWith('a');
    });

    it('刪除最後一張後顯示空狀態', async () => {
      imageServiceMock.getAllImagesSorted.mockResolvedValue([image('only')]);
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(1));

      fireEvent.click(screen.getByLabelText('刪除'));

      expect(await screen.findByText('尚無合成照片')).toBeInTheDocument();
    });

    it('失敗：保留該張並記錄錯誤', async () => {
      imageServiceMock.deleteImage.mockRejectedValue(new Error('locked'));
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getAllByLabelText('刪除')[0]);

      await waitFor(() => expect(console.error).toHaveBeenCalledWith('Failed to delete image:', expect.any(Error)));
      expect(items()).toHaveLength(2);
    });
  });

  describe('最愛', () => {
    it('加入最愛：以 isFavorite=true 更新，並更新畫面上的按鈕狀態', async () => {
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getByLabelText('標記最愛'));

      await waitFor(() => expect(screen.queryByLabelText('標記最愛')).not.toBeInTheDocument());
      expect(imageServiceMock.updateImage).toHaveBeenCalledWith('a', { isFavorite: true });
      expect(screen.getAllByLabelText('取消最愛')).toHaveLength(2);
    });

    it('取消最愛：以 isFavorite=false 更新', async () => {
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getByLabelText('取消最愛'));

      await waitFor(() => expect(screen.queryByLabelText('取消最愛')).not.toBeInTheDocument());
      expect(imageServiceMock.updateImage).toHaveBeenCalledWith('b', { isFavorite: false });
    });

    it('失敗：維持原狀並記錄錯誤', async () => {
      imageServiceMock.updateImage.mockRejectedValue(new Error('locked'));
      render(<GalleryPage />);
      await waitFor(() => expect(items()).toHaveLength(2));

      fireEvent.click(screen.getByLabelText('標記最愛'));

      await waitFor(() =>
        expect(console.error).toHaveBeenCalledWith('Failed to toggle favorite:', expect.any(Error))
      );
      expect(screen.getByLabelText('標記最愛')).toBeInTheDocument();
    });
  });
});
