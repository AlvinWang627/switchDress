import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import ScreenshotOverlay from '@/components/ScreenshotOverlay/ScreenshotOverlay';
import { MESSAGE_TYPES, type ChromeMessage } from '@/types/message';
import styles from '@/style/index.css?inline';
import type { SelectionRect } from '@/types/screenshot';

function ContentApp({ imageUrl, onUnmount }: { imageUrl: string; onUnmount: () => void }) {
  const handleConfirm = useCallback(
    (_selection: SelectionRect, blob: Blob) => {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        // 側邊欄透過 chrome.storage.onChanged 監聽 draftScreenshot，寫入後會立即顯示預覽
        chrome.storage.local.set({ draftScreenshot: base64data }, () => {
          onUnmount();
        });
      };
    },
    [onUnmount]
  );

  const handleCancel = useCallback(() => {
    // 結束截圖流程，讓側邊欄回到 idle
    chrome.storage.local.remove(['isCapturing']);
    onUnmount();
  }, [onUnmount]);

  // Initial selection (center 50%)
  const [initialSelection] = useState<SelectionRect>({
    x: Math.floor(window.innerWidth * 0.25),
    y: Math.floor(window.innerHeight * 0.25),
    width: Math.floor(window.innerWidth * 0.5),
    height: Math.floor(window.innerHeight * 0.5),
  });

  return (
    <ScreenshotOverlay
      imageUrl={imageUrl}
      initialSelection={initialSelection}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      fullScreen={true}
    />
  );
}

let rootInstance: any = null;
let shadowContainer: HTMLDivElement | null = null;

function mountOverlay(imageUrl: string) {
  if (shadowContainer) return;

  shadowContainer = document.createElement('div');
  shadowContainer.id = 'switchdress-screenshot-overlay';
  // ensure it appears on top of everything
  shadowContainer.style.position = 'fixed';
  shadowContainer.style.top = '0';
  shadowContainer.style.left = '0';
  shadowContainer.style.width = '100vw';
  shadowContainer.style.height = '100vh';
  shadowContainer.style.zIndex = '2147483647';
  document.body.appendChild(shadowContainer);

  const shadowRoot = shadowContainer.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  shadowRoot.appendChild(styleEl);

  const reactRootDiv = document.createElement('div');
  reactRootDiv.style.width = '100%';
  reactRootDiv.style.height = '100%';
  shadowRoot.appendChild(reactRootDiv);

  rootInstance = createRoot(reactRootDiv);
  rootInstance.render(
    <ContentApp
      imageUrl={imageUrl}
      onUnmount={() => {
        rootInstance?.unmount();
        shadowContainer?.remove();
        shadowContainer = null;
        rootInstance = null;
      }}
    />
  );
}

chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.START_OVERLAY) {
    // 立即回覆，避免側邊欄的 sendMessage 發生 lastError
    sendResponse({ success: true });

    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.CAPTURE_TAB }, (response) => {
      if (response && response.success && response.dataUrl) {
        mountOverlay(response.dataUrl);
      } else {
        alert('無法取得網頁截圖');
      }
    });
  }
  return true;
});
