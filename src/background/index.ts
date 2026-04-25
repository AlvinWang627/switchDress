// Background service worker for switch-dress Chrome Extension
import { MESSAGE_TYPES, type ChromeMessage } from '@/types/message';
import { imageService } from '@/services/imageService';
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
    default:
      console.warn('Unknown message type:', type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true;
});
