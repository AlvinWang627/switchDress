import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { installChromeMock, uninstallChromeMock, type StorageChangeListener } from '../helpers/chrome';
import { useScreenshot } from '@/hooks/useScreenshot';

const selection = { x: 1, y: 2, width: 3, height: 4 };
const DRAFT = 'data:image/png;base64,AAA';

describe('useScreenshot', () => {
  let chromeMock: ReturnType<typeof installChromeMock>['chrome'];
  let data: Record<string, unknown>;
  let storageListeners: StorageChangeListener[];
  let alertSpy: ReturnType<typeof vi.fn>;
  let closeSpy: ReturnType<typeof vi.fn>;

  const setup = (initial: Record<string, unknown> = {}) => {
    const installed = installChromeMock(initial);
    chromeMock = installed.chrome;
    data = installed.data;
    storageListeners = installed.storageListeners;
  };

  /** 讓 fetch(dataUrl) 回傳指定 Blob（草稿還原用） */
  const stubDraftFetch = (blob: Blob = new Blob(['img'], { type: 'image/png' })) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }));
    return blob;
  };

  beforeEach(() => {
    alertSpy = vi.fn();
    closeSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
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
    it('沒有草稿時 screenshots 為空，且保留 isCapturing（截圖可能仍在進行中）', () => {
      setup({ isCapturing: true });

      const { result } = renderHook(() => useScreenshot());

      expect(result.current.screenshots).toEqual([]);
      expect(result.current.captureState).toEqual({ status: 'idle' });
      expect(data.isCapturing).toBe(true);
    });

    it('側邊欄關閉期間完成的截圖（有草稿且 isCapturing）會還原成 Blob，並清除旗標', async () => {
      const blob = stubDraftFetch();
      setup({ draftScreenshot: DRAFT, isCapturing: true });

      const { result } = renderHook(() => useScreenshot());

      await waitFor(() => expect(result.current.screenshots).toHaveLength(1));
      expect(result.current.screenshots[0].blob).toBe(blob);
      expect(fetch).toHaveBeenCalledWith(DRAFT);
      expect(data.isCapturing).toBeUndefined();
      expect(data.draftScreenshot).toBe(DRAFT);
    });

    it('上一次開啟留下的草稿（沒有 isCapturing）會被刪除且不顯示（關閉側邊欄即清除）', () => {
      stubDraftFetch();
      setup({ draftScreenshot: DRAFT });

      const { result } = renderHook(() => useScreenshot());

      expect(data.draftScreenshot).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
      expect(result.current.screenshots).toEqual([]);
    });

    it('草稿還原失敗時記錄錯誤且不丟出例外', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('bad data url')));
      setup({ draftScreenshot: 'broken', isCapturing: true });

      const { result } = renderHook(() => useScreenshot());

      await waitFor(() => expect(console.error).toHaveBeenCalled());
      expect(result.current.screenshots).toEqual([]);
    });
  });

  describe('即時更新（storage.onChanged）', () => {
    it('content script 寫入 draftScreenshot 時立即顯示預覽，並結束截圖流程', async () => {
      const blob = stubDraftFetch();
      setup({ isCapturing: true });
      const { result } = renderHook(() => useScreenshot());

      act(() => {
        chromeMock.storage.local.set({ draftScreenshot: DRAFT });
      });

      await waitFor(() => expect(result.current.screenshots).toHaveLength(1));
      expect(result.current.screenshots[0].blob).toBe(blob);
      expect(result.current.captureState).toEqual({ status: 'idle' });
      expect(data.isCapturing).toBeUndefined();
    });

    it('新的截圖會取代目前的預覽', async () => {
      const first = new Blob(['first']);
      const second = new Blob(['second']);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ blob: () => Promise.resolve(first) })
        .mockResolvedValueOnce({ blob: () => Promise.resolve(second) });
      vi.stubGlobal('fetch', fetchMock);
      setup();
      const { result } = renderHook(() => useScreenshot());

      act(() => {
        chromeMock.storage.local.set({ draftScreenshot: 'data:1' });
      });
      await waitFor(() => expect(result.current.screenshots[0]?.blob).toBe(first));

      act(() => {
        chromeMock.storage.local.set({ draftScreenshot: 'data:2' });
      });
      await waitFor(() => expect(result.current.screenshots[0]?.blob).toBe(second));
      expect(result.current.screenshots).toHaveLength(1);
    });

    it('isCapturing 被移除（使用者取消框選）時回到 idle', () => {
      setup();
      // query 永遠不回呼 → 狀態停在 capturing
      chromeMock.tabs.query.mockImplementation(() => {});
      const { result } = renderHook(() => useScreenshot());
      act(() => {
        void result.current.capture();
      });
      data.isCapturing = true;

      act(() => {
        chromeMock.storage.local.remove(['isCapturing']);
      });

      expect(result.current.captureState).toEqual({ status: 'idle' });
    });

    it('忽略 draftScreenshot 被移除的事件，不清空目前的預覽', () => {
      setup({ draftScreenshot: 'x' });
      const { result } = renderHook(() => useScreenshot());
      act(() => result.current.addScreenshot(new Blob(['a']), selection));

      act(() => {
        storageListeners.forEach((l) => l({ draftScreenshot: { oldValue: 'x' } }, 'local'));
      });

      expect(result.current.screenshots).toHaveLength(1);
    });

    it('忽略其他 storage 區域的變更', () => {
      stubDraftFetch();
      setup();
      renderHook(() => useScreenshot());

      act(() => {
        storageListeners.forEach((l) => l({ draftScreenshot: { newValue: DRAFT } }, 'sync'));
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('卸載時移除 listener', () => {
      setup();
      const { unmount } = renderHook(() => useScreenshot());
      expect(storageListeners).toHaveLength(1);

      unmount();

      expect(storageListeners).toHaveLength(0);
    });
  });

  describe('capture', () => {
    const activeTab = (tabs: Array<{ id?: number }>) =>
      chromeMock.tabs.query.mockImplementation((_q: unknown, cb: (t: unknown[]) => void) => cb(tabs));

    it('對作用中分頁送出 START_OVERLAY 並設定 isCapturing，側邊欄保持開啟', () => {
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
      expect(closeSpy).not.toHaveBeenCalled();
      expect(result.current.captureState).toEqual({ status: 'capturing' });
    });

    it('完整流程：送出 START_OVERLAY → content script 存下截圖 → 側邊欄顯示預覽', async () => {
      const blob = stubDraftFetch();
      setup();
      activeTab([{ id: 9 }]);
      chromeMock.tabs.sendMessage.mockImplementation((_id: number, _msg: unknown, cb: () => void) => cb());
      const { result } = renderHook(() => useScreenshot());

      act(() => {
        void result.current.capture();
      });
      act(() => {
        // 模擬 content script 在使用者框選確認後寫入
        chromeMock.storage.local.set({ draftScreenshot: DRAFT });
      });

      await waitFor(() => expect(result.current.screenshots[0]?.blob).toBe(blob));
      expect(result.current.captureState).toEqual({ status: 'idle' });
      expect(data.isCapturing).toBeUndefined();
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
        expect(data.isCapturing).toBeUndefined();
        expect(result.current.captureState).toEqual({ status: 'idle' });
      }
    );

    it('其他 lastError（例如 port closed）不提示，維持截圖流程', () => {
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

      expect(alertSpy).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
      expect(data.isCapturing).toBe(true);
      expect(result.current.captureState).toEqual({ status: 'capturing' });
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
      setup();
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
});
