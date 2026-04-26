// chrome.tabs.captureVisibleTab wrapper service

import type { CaptureError } from '@/types/screenshot';

interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
}

interface CaptureErrorResult {
  error: CaptureError;
}

export async function captureVisibleTab(): Promise<CaptureResult> {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl: string | undefined) => {
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message ?? 'Unknown error';
        const errorType: CaptureError['type'] =
          errorMessage.includes('Permission') || errorMessage.includes('permission')
            ? 'PERMISSION_DENIED'
            : 'CAPTURE_FAILED';

        reject({
          error: {
            type: errorType,
            message: errorMessage,
          },
        } as CaptureErrorResult);
        return;
      }

      if (!dataUrl) {
        reject({
          error: {
            type: 'CAPTURE_FAILED',
            message: 'No data captured',
          },
        } as CaptureErrorResult);
        return;
      }

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject({
          error: {
            type: 'UNKNOWN',
            message: 'Failed to load captured image',
          },
        } as CaptureErrorResult);
      };
      img.src = dataUrl;
    });
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function cropImage(
  blob: Blob,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      canvas.toBlob(
        (croppedBlob) => {
          if (croppedBlob) {
            resolve(croppedBlob);
          } else {
            reject(new Error('Failed to create cropped blob'));
          }
        },
        'image/png'
      );
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = URL.createObjectURL(blob);
  });
}