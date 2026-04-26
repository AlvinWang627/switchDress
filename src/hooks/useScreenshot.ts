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

export function useScreenshot(): UseScreenshotReturn {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [captureState, setCaptureState] = useState<SelectionState>({ status: 'idle' });

  // Check for draft screenshot on mount
  useEffect(() => {
    chrome.storage.local.get(['draftScreenshot', 'isCapturing'], (result) => {
      if (result.draftScreenshot) {
        // We have a draft! Convert base64 back to Blob
        fetch(result.draftScreenshot as string)
          .then((res) => res.blob())
          .then((blob) => {
            const fakeSelection: SelectionRect = { x: 0, y: 0, width: 0, height: 0 }; // Not important for preview
            setScreenshots([{ blob, timestamp: Date.now(), selection: fakeSelection }]);
            // Clear the flag
            chrome.storage.local.remove(['isCapturing']);
          })
          .catch((err) => console.error('Failed to load draft screenshot:', err));
      } else {
        // If popup is opened and we are not capturing, maybe clear?
        // Let's rely on unmount for clearing if needed.
        chrome.storage.local.remove(['isCapturing']);
      }
    });
  }, []);

  const capture = useCallback(async () => {
    console.log('[useScreenshot] Starting capture on active tab');
    setCaptureState({ status: 'capturing' });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.storage.local.set({ isCapturing: true }, () => {
          chrome.tabs.sendMessage(activeTab.id!, { type: 'START_OVERLAY' }, () => {
            if (chrome.runtime.lastError) {
              const errMsg = chrome.runtime.lastError.message || '';
              // 如果是因為 content script 沒載入
              if (errMsg.includes('Could not establish connection') || errMsg.includes('Receiving end does not exist')) {
                console.warn('Content script not loaded:', errMsg);
                alert('請重新整理網頁後再試一次！(Please refresh the page)');
                chrome.storage.local.remove(['isCapturing']);
                setCaptureState({ status: 'idle' });
              } else {
                // 如果只是 Port closed (忘記 sendResponse 等情況)，我們依然關閉 popup
                window.close();
              }
            } else {
              // 成功送達，關閉 popup 讓使用者能在網頁上操作
              window.close();
            }
          });
        });
      } else {
        alert('找不到作用中的網頁');
        setCaptureState({ status: 'idle' });
      }
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
    chrome.storage.local.remove(['draftScreenshot']);
  }, []);

  const clearAll = useCallback(() => {
    screenshots.forEach((s) => {
      URL.revokeObjectURL(URL.createObjectURL(s.blob));
    });
    setScreenshots([]);
    chrome.storage.local.remove(['draftScreenshot']);
  }, [screenshots]);

  const addScreenshot = useCallback((blob: Blob, selection: SelectionRect) => {
    setScreenshots((prev) => [...prev, { blob, timestamp: Date.now(), selection }]);
  }, []);

  const resetCapture = useCallback(() => {
    setCaptureState({ status: 'idle' });
  }, []);

  // Cleanup on unmount (US3)
  useEffect(() => {
    return () => {
      // Free memory
      screenshots.forEach((s) => {
        URL.revokeObjectURL(URL.createObjectURL(s.blob));
      });
      // US3: 關閉 popup 時，截圖自動被刪除
      // Only delete if we are NOT currently starting a capture process
      chrome.storage.local.get(['isCapturing'], (result) => {
        if (!result.isCapturing) {
          chrome.storage.local.remove(['draftScreenshot']);
        }
      });
    };
  }, [screenshots]);

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