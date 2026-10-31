import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';
import { useScreenshot } from '@/hooks/useScreenshot';

const selection = { x: 1, y: 2, width: 3, height: 4 };

describe('useScreenshot', () => {
  let chromeMock: ReturnType<typeof installChromeMock>['chrome'];
  let data: Record<string, unknown>;
  let alertSpy: ReturnType<typeof vi.fn>;
  let closeSpy: ReturnType<typeof vi.fn>;

  const setup = (initial: Record<string, unknown> = {}) => {
    const installed = installChromeMock(initial);
    chromeMock = installed.chrome;
    data = installed.data;
  };

  beforeEach(() => {
    alertSpy = vi.fn();
    closeSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    vi.stubGlobal('close', closeSpy);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.close = closeSpy as unknown as typeof window.close;
  });

  afterEach(() => {
    // 先卸載 hook（其 cleanup 會用到 chrome），再移除 chrome mock
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    uninstallChromeMock();
  });

  describe('掛載時', () => {
    it('沒有草稿時 screenshots 為空，並清除 isCapturing 旗標', () => {
      setup({ isCapturing: true });

      const { result } = renderHook(() => useScreenshot());

      expect(result.current.screenshots).toEqual([]);
      expect(result.current.captureState).toEqual({ status: 'idle' });
      expect(data.isCapturing).toBeUndefined();
    });

    it('有草稿時還原成 Blob，並清除 isCapturing 旗標', async () => {
      const blob = new Blob(['img'], { type: 'image/png' });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }));
      setup({ draftScreenshot: 'data:image/png;base64,AAA', isCapturing: true });

      const { result } = renderHook(() => useScreenshot());

      await waitFor(() => expect(result.current.screenshots).toHaveLength(1));
      expect(result.current.screenshots[0].blob).toBe(blob);
      expect(fetch).toHaveBeenCalledWith('data:image/png;base64,AAA');
      expect(data.isCapturing).toBeUndefined();
    });

    it('草稿還原失敗時記錄錯誤且不丟出例外', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('bad data url')));
      setup({ draftScreenshot: 'broken' });

      const { result } = renderHook(() => useScreenshot());

      await waitFor(() => expect(console.error).toHaveBeenCalled());
      expect(result.current.screenshots).toEqual([]);
    });
  });

  describe('capture', () => {
    const activeTab = (tabs: Array<{ id?: number }>) =>
      chromeMock.tabs.query.mockImplementation((_q: unknown, cb: (t: unknown[]) => void) => cb(tabs));

    it('對作用中分頁送出 START_OVERLAY，成功後關閉 popup 並保留 isCapturing', () => {
      setup();
      activeTab([{ id: 9 }]);
      chromeMock.tabs.sendMessage.mockImplementation((_id: number, _msg: unknown, cb: () => void) => cb());
      const { result } = renderHook(() => useScreenshot());

      act(() => {
        void result.current.capture();
      });

      expect(chromeMock.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function));
      expect(chromeMock.tabs.sendMessage).toHaveBeenCalledWith(9, { type: 'START_OVERLAY' }, expect.any(Function));
      expect(data.isCapturing).toBe(true);
      expect(closeSpy).toHaveBeenCalled();
      expect(result.current.captureState).toEqual({ status: 'capturing' });
    });

    it('找不到作用中分頁時提示並回到 idle', () => {
      setup();
      activeTab([]);
      const { result } = renderHook(() => useScreenshot());

      act(() => {
        void result.current.capture();
      });

      expect(alertSpy).toHaveBeenCalledWith('找不到作用中的網頁');
      expect(chromeMock.tabs.sendMessage).not.toHaveBeenCalled();
      expect(result.current.captureState).toEqual({ status: 'idle' });
    });

    it.each(['Could not establish connection. Receiving end does not exist.', 'Receiving end does not exist'])(
      'content script 未載入（%s）時提示重新整理並回到 idle',
      (message) => {
        setup();
        activeTab([{ id: 1 }]);
        chromeMock.tabs.sendMessage.mockImplementation((_id: number, _msg: unknown, cb: () => void) => {
          chromeMock.runtime.lastError = { message };
          cb();
        });
        const { result } = renderHook(() => useScreenshot());

        act(() => {
          void result.current.capture();
        });

        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('重新整理'));
        expect(closeSpy).not.toHaveBeenCalled();
        expect(data.isCapturing).toBeUndefined();
        expect(result.current.captureState).toEqual({ status: 'idle' });
      }
    );

    it('其他 lastError（例如 port closed）仍關閉 popup', () => {
      setup();
      activeTab([{ id: 1 }]);
      chromeMock.tabs.sendMessage.mockImplementation((_id: number, _msg: unknown, cb: () => void) => {
        chromeMock.runtime.lastError = { message: 'The message port closed before a response was received.' };
        cb();
      });
      const { result } = renderHook(() => useScreenshot());

      act(() => {
        void result.current.capture();
      });

      expect(closeSpy).toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('管理截圖', () => {
    it('addScreenshot 新增一筆並帶入選取範圍', () => {
      setup();
      const { result } = renderHook(() => useScreenshot());
      const blob = new Blob(['x']);

      act(() => result.current.addScreenshot(blob, selection));

      expect(result.current.screenshots).toHaveLength(1);
      expect(result.current.screenshots[0]).toMatchObject({ blob, selection });
    });

    it('remove 刪除指定索引並移除草稿', () => {
      setup({ draftScreenshot: 'x' });
      const { result } = renderHook(() => useScreenshot());
      act(() => {
        result.current.addScreenshot(new Blob(['a']), selection);
        result.current.addScreenshot(new Blob(['b']), selection);
      });
      const second = result.current.screenshots[1];

      act(() => result.current.remove(0));

      expect(result.current.screenshots).toEqual([second]);
      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith(['draftScreenshot']);
    });

    it('clearAll 清空列表並移除草稿', () => {
      setup();
      const { result } = renderHook(() => useScreenshot());
      act(() => result.current.addScreenshot(new Blob(['a']), selection));

      act(() => result.current.clearAll());

      expect(result.current.screenshots).toEqual([]);
      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith(['draftScreenshot']);
    });

    it('resetCapture 從 capturing 回到 idle', () => {
      setup();
      // 找不到分頁的 query 永遠不回呼 → 狀態停在 capturing
      chromeMock.tabs.query.mockImplementation(() => {});
      const { result } = renderHook(() => useScreenshot());
      act(() => {
        void result.current.capture();
      });
      expect(result.current.captureState).toEqual({ status: 'capturing' });

      act(() => result.current.resetCapture());

      expect(result.current.captureState).toEqual({ status: 'idle' });
    });
  });

  describe('卸載時', () => {
    it('沒有進行中的截圖流程時刪除草稿（關閉 popup 即刪除）', () => {
      setup({ draftScreenshot: 'x' });
      const { unmount } = renderHook(() => useScreenshot());

      unmount();

      expect(data.draftScreenshot).toBeUndefined();
    });

    it('截圖流程進行中（isCapturing）不刪除草稿', () => {
      setup({ draftScreenshot: 'x' });
      const { unmount } = renderHook(() => useScreenshot());
      data.isCapturing = true;

      unmount();

      expect(data.draftScreenshot).toBe('x');
    });
  });
});
