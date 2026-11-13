// Screenshot state management hook

import { useState, useEffect, useCallback } from 'react';
import type { ScreenshotData, SelectionState, SelectionRect } from '@/types/screenshot';

interface UseScreenshotReturn {
  screenshots: ScreenshotData[];
  captureState: SelectionState;
  capture: () => Promise<void>;
  remove: (index: number) => void;
  clearAll: () => void;
  addScreenshot: (blob: Blob, selection: SelectionRect) => void;
  resetCapture: () => void;
}

const DRAFT_KEY = 'draftScreenshot';
const CAPTURING_KEY = 'isCapturing';

/** 裁切已在 content script 完成，預覽不需要選取範圍 */
const EMPTY_SELECTION: SelectionRect = { x: 0, y: 0, width: 0, height: 0 };

export function useScreenshot(): UseScreenshotReturn {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [captureState, setCaptureState] = useState<SelectionState>({ status: 'idle' });

  /** 把 content script 存下的 base64 草稿還原成 Blob，並結束截圖流程 */
  const loadDraft = useCallback((dataUrl: string) => {
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        setScreenshots([{ blob, timestamp: Date.now(), selection: EMPTY_SELECTION }]);
        setCaptureState({ status: 'idle' });
        chrome.storage.local.remove([CAPTURING_KEY]);
      })
      .catch((err) => console.error('Failed to load draft screenshot:', err));
  }, []);

  // 掛載時：
  // - isCapturing 仍為 true → 截圖是在側邊欄關閉期間完成的，還原它。
  // - 否則草稿是上一次開啟側邊欄留下的 → 依 FR-006（關閉即清除）刪除。
  //   側邊欄關閉時頁面直接銷毀，React cleanup 不保證執行，因此改在下次開啟時清除。
  useEffect(() => {
    chrome.storage.local.get([DRAFT_KEY, CAPTURING_KEY], (result) => {
      const draft = result[DRAFT_KEY];
      if (typeof draft !== 'string') return;

      if (result[CAPTURING_KEY]) {
        loadDraft(draft);
      } else {
        chrome.storage.local.remove([DRAFT_KEY]);
      }
    });
  }, [loadDraft]);

  // 側邊欄在使用者框選時保持開啟：即時接收 content script 寫入的截圖與取消通知。
  // 刻意忽略 draftScreenshot 被移除的事件，避免其他視窗的側邊欄清除草稿時連帶清空這裡的預覽。
  useEffect(() => {
    const handleChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;

      const draft: unknown = changes[DRAFT_KEY]?.newValue;
      if (typeof draft === 'string') {
        loadDraft(draft);
      }

      const capturing = changes[CAPTURING_KEY];
      if (capturing && capturing.newValue === undefined) {
        setCaptureState({ status: 'idle' });
      }
    };

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, [loadDraft]);

  const capture = useCallback(async () => {
    console.log('[useScreenshot] Starting capture on active tab');
    setCaptureState({ status: 'capturing' });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        alert('找不到作用中的網頁');
        setCaptureState({ status: 'idle' });
        return;
      }

      chrome.storage.local.set({ [CAPTURING_KEY]: true }, () => {
        chrome.tabs.sendMessage(tabId, { type: 'START_OVERLAY' }, () => {
          // 必須讀取 lastError，否則 Chrome 會報 Unchecked runtime.lastError
          const errMsg = chrome.runtime.lastError?.message;
          if (errMsg === undefined) return; // 已送達；等待 content script 寫入 draftScreenshot

          if (errMsg.includes('Could not establish connection') || errMsg.includes('Receiving end does not exist')) {
            // content script 沒載入（頁面在安裝擴充前就已開啟，或是 chrome:// 等受限頁面）
            console.warn('Content script not loaded:', errMsg);
            alert('請重新整理網頁後再試一次！(Please refresh the page)');
            chrome.storage.local.remove([CAPTURING_KEY]);
            setCaptureState({ status: 'idle' });
          } else {
            // 例如 port closed：content script 已收到訊息，overlay 仍會出現
            console.warn('START_OVERLAY responded with error:', errMsg);
          }
        });
      });
    });
  }, []);

  const remove = useCallback((index: number) => {
    setScreenshots((prev) => {
      const newScreenshots = [...prev];
      const removed = newScreenshots.splice(index, 1);
      if (removed[0]) {
        URL.revokeObjectURL(URL.createObjectURL(removed[0].blob));
      }
      return newScreenshots;
    });
    // Also remove from storage
    chrome.storage.local.remove([DRAFT_KEY]);
  }, []);

  const clearAll = useCallback(() => {
    screenshots.forEach((s) => {
      URL.revokeObjectURL(URL.createObjectURL(s.blob));
    });
    setScreenshots([]);
    chrome.storage.local.remove([DRAFT_KEY]);
  }, [screenshots]);

  const addScreenshot = useCallback((blob: Blob, selection: SelectionRect) => {
    setScreenshots((prev) => [...prev, { blob, timestamp: Date.now(), selection }]);
  }, []);

  const resetCapture = useCallback(() => {
    setCaptureState({ status: 'idle' });
  }, []);

  return {
    screenshots,
    captureState,
    capture,
    remove,
    clearAll,
    addScreenshot,
    resetCapture,
  };
}
