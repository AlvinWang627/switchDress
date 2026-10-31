import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ImageRecord } from '@/types/popup';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';

const mocks = vi.hoisted(() => ({
  useImageStorage: vi.fn(),
  useScreenshot: vi.fn(),
}));

vi.mock('@/hooks/useImageStorage', () => ({ useImageStorage: mocks.useImageStorage }));
vi.mock('@/hooks/useScreenshot', () => ({ useScreenshot: mocks.useScreenshot }));
vi.mock('@/popup/index.css?inline', () => ({ default: '' }));

import PopupApp from '@/popup/index';

const image = (id: string): ImageRecord => ({ id, blob: new Blob([id]), timestamp: 1 });

const storageState = (overrides: Record<string, unknown> = {}) => ({
  images: [] as ImageRecord[],
  isLoading: false,
  error: null,
  saveImage: vi.fn(),
  deleteImage: vi.fn(),
  refreshImages: vi.fn(),
  ...overrides,
});

const screenshotState = (overrides: Record<string, unknown> = {}) => ({
  screenshots: [] as Array<{ blob: Blob }>,
  captureState: { status: 'idle' },
  capture: vi.fn(),
  remove: vi.fn(),
  clearAll: vi.fn(),
  addScreenshot: vi.fn(),
  resetCapture: vi.fn(),
  ...overrides,
});

describe('PopupApp', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.useImageStorage.mockReturnValue(storageState());
    mocks.useScreenshot.mockReturnValue(screenshotState());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    uninstallChromeMock();
  });

  describe('標題列', () => {
    it('顯示品牌名稱與三個動作按鈕', () => {
      render(<PopupApp />);

      expect(screen.getByRole('heading', { level: 1, name: 'switchDress' })).toBeInTheDocument();
      expect(screen.getByLabelText('Album')).toBeInTheDocument();
      expect(screen.getByLabelText('Camera')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('點擊相機按鈕開始截圖', () => {
      const state = screenshotState();
      mocks.useScreenshot.mockReturnValue(state);
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Camera'));

      expect(state.capture).toHaveBeenCalledTimes(1);
    });
  });

  describe('衣服截圖區', () => {
    it('沒有截圖時顯示空狀態提示', () => {
      render(<PopupApp />);
      expect(screen.getByText('尚無截圖')).toBeInTheDocument();
      expect(screen.getByText('在網頁上框選衣服區域進行截圖')).toBeInTheDocument();
    });

    it('有截圖時顯示預覽，刪除時移除第 0 張', () => {
      const state = screenshotState({ screenshots: [{ blob: new Blob(['s']) }] });
      mocks.useScreenshot.mockReturnValue(state);
      render(<PopupApp />);

      expect(screen.queryByText('尚無截圖')).not.toBeInTheDocument();
      expect(screen.getByAltText('Screenshot')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('刪除截圖'));

      expect(state.remove).toHaveBeenCalledWith(0);
    });
  });

  describe('個人照片區', () => {
    it('載入中顯示載入提示，不顯示照片區', () => {
      mocks.useImageStorage.mockReturnValue(storageState({ isLoading: true }));
      render(<PopupApp />);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
      expect(screen.queryByText('尚未上傳相片')).not.toBeInTheDocument();
    });

    it('沒有照片時顯示引導前往設定', () => {
      render(<PopupApp />);
      expect(screen.getByText('尚未上傳相片')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /前往設定/ })).toBeInTheDocument();
    });

    it('有多張照片時全部列出，並可點擊選取', () => {
      mocks.useImageStorage.mockReturnValue(storageState({ images: [image('a'), image('b')] }));
      render(<PopupApp />);

      const options = screen.getAllByRole('button').filter((el) => within(el).queryByAltText('Portrait'));
      expect(options).toHaveLength(2);
      expect(screen.getByText('請選擇個人照片')).toBeInTheDocument();

      fireEvent.click(options[1]);

      expect(within(options[1]).getByTestId('icon')).toHaveAttribute('data-icon', 'mdi:check');
      expect(within(options[0]).queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('可用 Enter 鍵選取照片', () => {
      mocks.useImageStorage.mockReturnValue(storageState({ images: [image('a'), image('b')] }));
      render(<PopupApp />);
      const [first] = screen.getAllByRole('button').filter((el) => within(el).queryByAltText('Portrait'));

      fireEvent.keyDown(first, { key: 'Enter' });

      expect(within(first).getByTestId('icon')).toHaveAttribute('data-icon', 'mdi:check');
    });

    it('只有一張照片時自動選取', () => {
      mocks.useImageStorage.mockReturnValue(storageState({ images: [image('only')] }));
      render(<PopupApp />);

      expect(screen.getByRole('button', { name: 'AI 合成' })).toBeEnabled();
    });

    it('最多只顯示 6 張', () => {
      const images = Array.from({ length: 8 }, (_, i) => image(String(i)));
      mocks.useImageStorage.mockReturnValue(storageState({ images }));
      render(<PopupApp />);

      expect(screen.getAllByAltText('Portrait')).toHaveLength(6);
    });

    it('優先使用縮圖', () => {
      const thumbnail = new Blob(['thumb']);
      const withThumb: ImageRecord = { ...image('a'), thumbnail };
      mocks.useImageStorage.mockReturnValue(storageState({ images: [withThumb, image('b')] }));
      render(<PopupApp />);

      expect(URL.createObjectURL).toHaveBeenCalledWith(thumbnail);
    });
  });

  describe('AI 合成按鈕', () => {
    it('沒有選取照片時停用', () => {
      render(<PopupApp />);
      expect(screen.getByRole('button', { name: 'AI 合成' })).toBeDisabled();
    });

    it('多張照片未選取時停用，選取後啟用', () => {
      mocks.useImageStorage.mockReturnValue(storageState({ images: [image('a'), image('b')] }));
      render(<PopupApp />);
      const aiButton = screen.getByRole('button', { name: 'AI 合成' });
      expect(aiButton).toBeDisabled();

      const [first] = screen.getAllByRole('button').filter((el) => within(el).queryByAltText('Portrait'));
      fireEvent.click(first);

      expect(aiButton).toBeEnabled();
    });
  });

  describe('開啟設定頁', () => {
    it('非擴充環境：以 window.open 開啟開發用網址', () => {
      uninstallChromeMock();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Settings'));

      expect(openSpy).toHaveBeenCalledWith('/src/options/index.html', '_blank');
    });

    it('擴充環境：使用 chrome.runtime.openOptionsPage', () => {
      const { chrome } = installChromeMock();
      Object.assign(chrome.runtime, { id: 'ext', openOptionsPage: vi.fn(), getURL: vi.fn() });
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Settings'));

      expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
    });

    it('openOptionsPage 回報錯誤時改以 tabs.create 開新分頁', () => {
      const { chrome } = installChromeMock();
      Object.assign(chrome.runtime, {
        id: 'ext',
        getURL: vi.fn((p: string) => `chrome-extension://ext/${p}`),
        openOptionsPage: vi.fn((cb: () => void) => {
          chrome.runtime.lastError = { message: 'fail' };
          cb();
        }),
      });
      Object.assign(chrome.tabs, { create: vi.fn() });
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Settings'));

      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://ext/options/index.html' });
    });

    it('沒有 openOptionsPage 時直接以 tabs.create 開新分頁', () => {
      const { chrome } = installChromeMock();
      Object.assign(chrome.runtime, {
        id: 'ext',
        getURL: vi.fn((p: string) => `chrome-extension://ext/${p}`),
      });
      Object.assign(chrome.tabs, { create: vi.fn() });
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Settings'));

      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://ext/options/index.html' });
    });

    it('「前往設定」按鈕與標題列設定鈕行為一致', () => {
      uninstallChromeMock();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      render(<PopupApp />);

      fireEvent.click(screen.getByRole('button', { name: /前往設定/ }));

      expect(openSpy).toHaveBeenCalledWith('/src/options/index.html', '_blank');
    });
  });
});
