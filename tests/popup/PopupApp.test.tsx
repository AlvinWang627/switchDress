import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { PersonalPhoto } from '@/types';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';

const mocks = vi.hoisted(() => ({
  useScreenshot: vi.fn(),
  usePersonalPhoto: vi.fn(),
  useSettings: vi.fn(),
  useAISynthesis: vi.fn(),
  useNotification: vi.fn(),
}));

vi.mock('@/hooks/useScreenshot', () => ({ useScreenshot: mocks.useScreenshot }));
vi.mock('@/hooks/usePersonalPhoto', () => ({ usePersonalPhoto: mocks.usePersonalPhoto }));
vi.mock('@/hooks/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/hooks/useAISynthesis', () => ({ useAISynthesis: mocks.useAISynthesis }));
vi.mock('@/hooks/useNotification', () => ({ useNotification: mocks.useNotification }));
vi.mock('@/popup/index.css?inline', () => ({ default: '' }));

import PopupApp from '@/popup/index';

const photo = (id: string): PersonalPhoto => ({
  id,
  blob: new Blob([id], { type: 'image/png' }),
  name: `${id}.png`,
  type: 'image/png',
  uploadedAt: 1,
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

const photoState = (overrides: Record<string, unknown> = {}) => ({
  photos: [] as PersonalPhoto[],
  selectedPhoto: null as PersonalPhoto | null,
  isLoading: false,
  error: null,
  selectPhoto: vi.fn(),
  refresh: vi.fn(),
  ...overrides,
});

const synthesisState = (overrides: Record<string, unknown> = {}) => ({
  status: 'idle',
  error: null,
  synthesize: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn(),
  ...overrides,
});

const notificationState = () => ({
  showSynthesisComplete: vi.fn(),
  showError: vi.fn(),
});

const SETTINGS = { model: 'gemini-3.1-flash-image-preview', apiKey: 'key' };

/** 具備合成所需的全部條件：已選照片、已有截圖、已設定 API Key */
const readyToSynthesize = () => {
  const selected = photo('a');
  const clothing = new Blob(['shirt']);
  mocks.usePersonalPhoto.mockReturnValue(photoState({ photos: [selected], selectedPhoto: selected }));
  mocks.useScreenshot.mockReturnValue(screenshotState({ screenshots: [{ blob: clothing }] }));
  return { selected, clothing };
};

const aiButton = (name: string | RegExp = 'AI 合成') => screen.getByRole('button', { name });

describe('PopupApp', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.useScreenshot.mockReturnValue(screenshotState());
    mocks.usePersonalPhoto.mockReturnValue(photoState());
    mocks.useSettings.mockReturnValue({ settings: SETTINGS });
    mocks.useAISynthesis.mockReturnValue(synthesisState());
    mocks.useNotification.mockReturnValue(notificationState());
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

    it('相簿按鈕：擴充環境以 tabs.create 開啟 gallery 頁', () => {
      const { chrome } = installChromeMock();
      Object.assign(chrome.runtime, { id: 'ext', getURL: vi.fn((p: string) => `chrome-extension://ext/${p}`) });
      Object.assign(chrome.tabs, { create: vi.fn() });
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Album'));

      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://ext/gallery/index.html' });
    });

    it('相簿按鈕：非擴充環境以 window.open 開啟開發用網址', () => {
      uninstallChromeMock();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      render(<PopupApp />);

      fireEvent.click(screen.getByLabelText('Album'));

      expect(openSpy).toHaveBeenCalledWith('/src/gallery/index.html', '_blank');
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
    it('載入中顯示載入提示', () => {
      mocks.usePersonalPhoto.mockReturnValue(photoState({ isLoading: true }));
      render(<PopupApp />);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
      expect(screen.queryByText('尚未上傳相片')).not.toBeInTheDocument();
    });

    it('沒有照片時顯示引導前往設定', () => {
      render(<PopupApp />);
      expect(screen.getByText('尚未上傳相片')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /前往設定/ })).toBeInTheDocument();
    });

    it('列出照片，點擊時以該照片 id 呼叫 selectPhoto', () => {
      const state = photoState({ photos: [photo('a'), photo('b')] });
      mocks.usePersonalPhoto.mockReturnValue(state);
      render(<PopupApp />);

      expect(screen.getByText('請選擇個人照片')).toBeInTheDocument();
      fireEvent.click(screen.getByAltText('b.png'));

      expect(state.selectPhoto).toHaveBeenCalledWith('b');
    });

    it('可用 Enter 鍵選取照片', () => {
      const state = photoState({ photos: [photo('a'), photo('b')] });
      mocks.usePersonalPhoto.mockReturnValue(state);
      render(<PopupApp />);

      fireEvent.keyDown(screen.getByAltText('a.png').parentElement!, { key: 'Enter' });

      expect(state.selectPhoto).toHaveBeenCalledWith('a');
    });

    it('只在被選取的照片上顯示勾選標記', () => {
      const [a, b] = [photo('a'), photo('b')];
      mocks.usePersonalPhoto.mockReturnValue(photoState({ photos: [a, b], selectedPhoto: b }));
      render(<PopupApp />);

      const marks = screen.getAllByTestId('icon').filter((i) => i.dataset.icon === 'mdi:check');
      expect(marks).toHaveLength(1);
      expect(screen.getByAltText('b.png').parentElement).toContainElement(marks[0]);
    });

    it('最多只顯示 6 張', () => {
      const photos = Array.from({ length: 8 }, (_, i) => photo(String(i)));
      mocks.usePersonalPhoto.mockReturnValue(photoState({ photos }));
      render(<PopupApp />);

      expect(screen.getAllByRole('img')).toHaveLength(6);
    });
  });

  describe('AI 合成按鈕', () => {
    it.each([
      ['沒有選照片', () => mocks.usePersonalPhoto.mockReturnValue(photoState())],
      ['沒有截圖', () => mocks.useScreenshot.mockReturnValue(screenshotState())],
      ['沒有 API Key', () => mocks.useSettings.mockReturnValue({ settings: { ...SETTINGS, apiKey: '' } })],
    ])('%s時停用', (_label, breakCondition) => {
      readyToSynthesize();
      breakCondition();
      render(<PopupApp />);

      expect(aiButton()).toBeDisabled();
    });

    it('條件齊全時啟用', () => {
      readyToSynthesize();
      render(<PopupApp />);
      expect(aiButton()).toBeEnabled();
    });

    it('點擊後以個人照片、衣服截圖、API Key 與模型呼叫 synthesize', () => {
      const { selected, clothing } = readyToSynthesize();
      const synthesis = synthesisState();
      mocks.useAISynthesis.mockReturnValue(synthesis);
      render(<PopupApp />);

      fireEvent.click(aiButton());

      expect(synthesis.synthesize).toHaveBeenCalledWith(selected.blob, clothing, 'key', 'gemini-3.1-flash-image-preview');
    });

    it('synthesize 拋出例外時只記錄錯誤、不讓畫面崩潰', async () => {
      readyToSynthesize();
      mocks.useAISynthesis.mockReturnValue(synthesisState({ synthesize: vi.fn().mockRejectedValue(new Error('boom')) }));
      render(<PopupApp />);

      await act(async () => {
        fireEvent.click(aiButton());
      });

      expect(console.error).toHaveBeenCalledWith('Synthesis failed', expect.any(Error));
    });

    it.each([
      ['synthesizing', '合成中...', 'mdi:loading'],
      ['success', '合成完成', 'mdi:check'],
      ['error', '合成失敗', 'mdi:alert-circle'],
    ])('狀態 %s 顯示「%s」', (status, label, icon) => {
      readyToSynthesize();
      mocks.useAISynthesis.mockReturnValue(synthesisState({ status }));
      render(<PopupApp />);

      const button = aiButton(label);
      expect(button).toBeInTheDocument();
      expect(button.querySelector(`[data-icon="${icon}"]`)).toBeInTheDocument();
    });

    it('合成中即使條件齊全也停用，避免重複送出', () => {
      readyToSynthesize();
      mocks.useAISynthesis.mockReturnValue(synthesisState({ status: 'synthesizing' }));
      render(<PopupApp />);

      expect(aiButton('合成中...')).toBeDisabled();
    });
  });

  describe('合成結果通知', () => {
    const delayOf = (spy: ReturnType<typeof vi.spyOn>, fnCallIndex = -1) => {
      const calls = spy.mock.calls.filter(([, d]) => d === 2000 || d === 3000);
      return calls.at(fnCallIndex)!;
    };

    it('成功：發出完成通知，並於 2 秒後 reset', () => {
      const synthesis = synthesisState({ status: 'success' });
      const notification = notificationState();
      mocks.useAISynthesis.mockReturnValue(synthesis);
      mocks.useNotification.mockReturnValue(notification);
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      render(<PopupApp />);

      expect(notification.showSynthesisComplete).toHaveBeenCalledTimes(1);
      expect(notification.showError).not.toHaveBeenCalled();
      const [fn, delay] = delayOf(setTimeoutSpy);
      expect(delay).toBe(2000);
      expect(synthesis.reset).not.toHaveBeenCalled();
      (fn as () => void)();
      expect(synthesis.reset).toHaveBeenCalledTimes(1);
    });

    it('失敗：發出錯誤通知，並於 3 秒後 reset', () => {
      const synthesis = synthesisState({ status: 'error' });
      const notification = notificationState();
      mocks.useAISynthesis.mockReturnValue(synthesis);
      mocks.useNotification.mockReturnValue(notification);
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      render(<PopupApp />);

      expect(notification.showError).toHaveBeenCalledWith('AI合成失敗，請重試');
      expect(notification.showSynthesisComplete).not.toHaveBeenCalled();
      const [fn, delay] = delayOf(setTimeoutSpy);
      expect(delay).toBe(3000);
      (fn as () => void)();
      expect(synthesis.reset).toHaveBeenCalledTimes(1);
    });

    it.each(['idle', 'synthesizing'])('狀態 %s 不發出任何通知', (status) => {
      const notification = notificationState();
      mocks.useAISynthesis.mockReturnValue(synthesisState({ status }));
      mocks.useNotification.mockReturnValue(notification);

      render(<PopupApp />);

      expect(notification.showSynthesisComplete).not.toHaveBeenCalled();
      expect(notification.showError).not.toHaveBeenCalled();
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
