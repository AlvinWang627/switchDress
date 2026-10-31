// Background service worker for switch-dress Chrome Extension
import { MESSAGE_TYPES, type ChromeMessage } from '@/types/message';
import { imageService } from '@/services/imageService';
import { geminiService } from '@/services/geminiService';
import { notificationService } from '@/services/notificationService';
import type { ImageRecord } from '@/types/popup';

console.log('switch-dress background service worker loaded');

chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    case MESSAGE_TYPES.GET_IMAGES: {
      imageService
        .getAllImages()
        .then((images) => sendResponse({ success: true, data: images }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      break;
    }
    case MESSAGE_TYPES.SAVE_IMAGE: {
      const { blob, thumbnail } = payload as { blob: Blob; thumbnail?: Blob };
      const record: ImageRecord = {
        id: crypto.randomUUID(),
        blob,
        timestamp: Date.now(),
        thumbnail,
      };
      imageService
        .saveImage(record)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      break;
    }
    case MESSAGE_TYPES.CAPTURE_SCREENSHOT: {
      const { tabId } = payload as { tabId: number };
      console.log('Screenshot capture requested for tab:', tabId);
      sendResponse({ success: false, error: 'Not implemented yet' });
      break;
    }
    case MESSAGE_TYPES.CAPTURE_TAB: {
      console.log('[background] CAPTURE_TAB received');
      (async () => {
        try {
          // Service worker has no "current window" context,
          // so we must explicitly get the last focused window.
          const win = await chrome.windows.getLastFocused();
          console.log('[background] Last focused window:', win.id, 'type:', win.type);

          if (!win.id) {
            sendResponse({ success: false, error: { message: 'No focused window found' } });
            return;
          }

          const dataUrl = await chrome.tabs.captureVisibleTab(win.id, { format: 'png' });

          if (dataUrl) {
            console.log('[background] captureVisibleTab success, dataUrl length:', dataUrl.length);
            sendResponse({ success: true, dataUrl });
          } else {
            console.error('[background] captureVisibleTab returned empty dataUrl');
            sendResponse({ success: false, error: { message: 'No data captured' } });
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error('[background] captureVisibleTab error:', errMsg);
          sendResponse({ success: false, error: { message: errMsg } });
        }
      })();
      break;
    }
    case MESSAGE_TYPES.AI_SYNTHESIZE: {
      const { personalPhotoDataUrl, clothingDataUrl, apiKey, model } = payload as {
        personalPhotoDataUrl: string;
        clothingDataUrl: string;
        apiKey: string;
        model: string;
      };
      console.log('[background] AI_SYNTHESIZE received');
      (async () => {
        try {
          // Convert data URL to Blob
          const response = await fetch(personalPhotoDataUrl);
          const personalPhotoBlob = await response.blob();

          const result = await geminiService.synthesizeImage(
            personalPhotoBlob,
            clothingDataUrl,
            apiKey,
            model
          );

          if (result.success && result.imageBlob) {
            // Save to gallery (thumbnail creation skipped in background - Service Worker has no Canvas API)
            const record: ImageRecord = {
              id: crypto.randomUUID(),
              blob: result.imageBlob,
              timestamp: Date.now(),
              isFavorite: false,
            };

            await imageService.saveImage(record);
            notificationService.showSynthesisComplete();
            sendResponse({ success: true });
          } else {
            notificationService.showError(result.error || 'Unknown error');
            sendResponse({ success: false, error: result.error });
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error('[background] AI_SYNTHESIZE error:', errMsg);
          notificationService.showError(errMsg);
          sendResponse({ success: false, error: errMsg });
        }
      })();
      break;
    }
    default:
      console.warn('Unknown message type:', type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true;
});
