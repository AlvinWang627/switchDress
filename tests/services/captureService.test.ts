import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';
import { captureVisibleTab, dataUrlToBlob, cropImage } from '@/services/captureService';

/** 可控制 onload / onerror 的假 Image */
class FakeImage {
  static mode: 'load' | 'error' = 'load';
  static size = { width: 1920, height: 1080 };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = FakeImage.size.width;
  naturalHeight = FakeImage.size.height;
  private _src = '';
  get src() {
    return this._src;
  }
  set src(v: string) {
    this._src = v;
    queueMicrotask(() => (FakeImage.mode === 'load' ? this.onload?.() : this.onerror?.()));
  }
}

describe('captureService', () => {
  let chromeMock: ReturnType<typeof installChromeMock>['chrome'];

  beforeEach(() => {
    chromeMock = installChromeMock().chrome;
    FakeImage.mode = 'load';
    vi.stubGlobal('Image', FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    uninstallChromeMock();
  });

  describe('captureVisibleTab', () => {
    it('成功時回傳 dataUrl 與圖片尺寸，並以 png 格式截圖', async () => {
      chromeMock.tabs.captureVisibleTab.mockImplementation((_opts, cb) => cb('data:image/png;base64,AAA'));

      const result = await captureVisibleTab();

      expect(chromeMock.tabs.captureVisibleTab).toHaveBeenCalledWith({ format: 'png' }, expect.any(Function));
      expect(result).toEqual({ dataUrl: 'data:image/png;base64,AAA', width: 1920, height: 1080 });
    });

    it('lastError 含 permission 字樣時為 PERMISSION_DENIED', async () => {
      chromeMock.tabs.captureVisibleTab.mockImplementation((_opts, cb) => {
        chromeMock.runtime.lastError = { message: 'Missing host permission for the tab' };
        cb(undefined);
      });

      await expect(captureVisibleTab()).rejects.toEqual({
        error: { type: 'PERMISSION_DENIED', message: 'Missing host permission for the tab' },
      });
    });

    it('其他 lastError 為 CAPTURE_FAILED', async () => {
      chromeMock.tabs.captureVisibleTab.mockImplementation((_opts, cb) => {
        chromeMock.runtime.lastError = { message: 'Tab was closed' };
        cb(undefined);
      });

      await expect(captureVisibleTab()).rejects.toEqual({
        error: { type: 'CAPTURE_FAILED', message: 'Tab was closed' },
      });
    });

    it('lastError 沒有 message 時使用 Unknown error', async () => {
      chromeMock.tabs.captureVisibleTab.mockImplementation((_opts, cb) => {
        chromeMock.runtime.lastError = {};
        cb(undefined);
      });

      await expect(captureVisibleTab()).rejects.toEqual({
        error: { type: 'CAPTURE_FAILED', message: 'Unknown error' },
      });
    });

    it('沒有 dataUrl 時為 CAPTURE_FAILED', async () => {
      chromeMock.tabs.captureVisibleTab.mockImplementation((_opts, cb) => cb(undefined));

      await expect(captureVisibleTab()).rejects.toEqual({
        error: { type: 'CAPTURE_FAILED', message: 'No data captured' },
      });
    });

    it('圖片載入失敗時為 UNKNOWN', async () => {
      FakeImage.mode = 'error';
      chromeMock.tabs.captureVisibleTab.mockImplementation((_opts, cb) => cb('data:image/png;base64,AAA'));

      await expect(captureVisibleTab()).rejects.toEqual({
        error: { type: 'UNKNOWN', message: 'Failed to load captured image' },
      });
    });
  });

  describe('dataUrlToBlob', () => {
    it('透過 fetch 轉成 Blob', async () => {
      const blob = new Blob(['hi'], { type: 'image/png' });
      const fetchMock = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) });
      vi.stubGlobal('fetch', fetchMock);

      await expect(dataUrlToBlob('data:image/png;base64,AAA')).resolves.toBe(blob);
      expect(fetchMock).toHaveBeenCalledWith('data:image/png;base64,AAA');
    });
  });

  describe('cropImage', () => {
    const source = new Blob(['x'], { type: 'image/png' });
    let drawImage: ReturnType<typeof vi.fn>;
    let toBlob: ReturnType<typeof vi.fn>;
    let canvas: { width: number; height: number; getContext: ReturnType<typeof vi.fn>; toBlob: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      drawImage = vi.fn();
      toBlob = vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(['cropped'], { type: 'image/png' })));
      canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ drawImage })),
        toBlob,
      };
      const realCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
        tag === 'canvas' ? (canvas as unknown as HTMLCanvasElement) : realCreate(tag)
      );
      URL.createObjectURL = vi.fn(() => 'blob:src');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('依裁切區域繪製並輸出 png', async () => {
      const result = await cropImage(source, 10, 20, 300, 200);

      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(200);
      expect(drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 10, 20, 300, 200, 0, 0, 300, 200);
      expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
      expect(result.type).toBe('image/png');
    });

    it('取不到 canvas context 時 reject', async () => {
      canvas.getContext.mockReturnValue(null);
      await expect(cropImage(source, 0, 0, 10, 10)).rejects.toThrow('Failed to get canvas context');
    });

    it('toBlob 回傳 null 時 reject', async () => {
      toBlob.mockImplementation((cb: (b: Blob | null) => void) => cb(null));
      await expect(cropImage(source, 0, 0, 10, 10)).rejects.toThrow('Failed to create cropped blob');
    });

    it('圖片載入失敗時 reject', async () => {
      FakeImage.mode = 'error';
      await expect(cropImage(source, 0, 0, 10, 10)).rejects.toThrow('Failed to load image for cropping');
    });
  });
});
