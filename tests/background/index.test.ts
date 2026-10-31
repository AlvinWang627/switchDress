import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installChromeMock, uninstallChromeMock, type MessageListener } from '../helpers/chrome';
import { MESSAGE_TYPES } from '@/types/message';

const imageServiceMock = vi.hoisted(() => ({
  getAllImages: vi.fn(),
  saveImage: vi.fn(),
}));
const geminiServiceMock = vi.hoisted(() => ({ synthesizeImage: vi.fn() }));
const notificationServiceMock = vi.hoisted(() => ({
  showSynthesisComplete: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('@/services/imageService', () => ({ imageService: imageServiceMock }));
vi.mock('@/services/geminiService', () => ({ geminiService: geminiServiceMock }));
vi.mock('@/services/notificationService', () => ({ notificationService: notificationServiceMock }));

describe('background service worker', () => {
  let chromeMock: ReturnType<typeof installChromeMock>['chrome'];
  let listener: MessageListener;

  /** 送出訊息並等待 sendResponse 被呼叫 */
  const send = (message: unknown) =>
    new Promise<any>((resolve) => {
      const returned = listener(message, {}, resolve);
      expect(returned).toBe(true); // 必須回傳 true 才能非同步 sendResponse
    });

  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    imageServiceMock.getAllImages.mockReset();
    imageServiceMock.saveImage.mockReset();
    geminiServiceMock.synthesizeImage.mockReset();
    notificationServiceMock.showSynthesisComplete.mockReset();
    notificationServiceMock.showError.mockReset();

    const installed = installChromeMock();
    chromeMock = installed.chrome;
    await import('@/background/index');
    listener = installed.listeners[0];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    uninstallChromeMock();
  });

  it('載入時註冊 onMessage listener', () => {
    expect(chromeMock.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  describe('GET_IMAGES', () => {
    it('回傳所有圖片', async () => {
      const images = [{ id: 'a' }];
      imageServiceMock.getAllImages.mockResolvedValue(images);

      expect(await send({ type: MESSAGE_TYPES.GET_IMAGES })).toEqual({ success: true, data: images });
    });

    it('失敗時回傳錯誤訊息', async () => {
      imageServiceMock.getAllImages.mockRejectedValue(new Error('db down'));

      expect(await send({ type: MESSAGE_TYPES.GET_IMAGES })).toEqual({ success: false, error: 'db down' });
    });
  });

  describe('SAVE_IMAGE', () => {
    it('以 uuid 與時間戳建立紀錄後儲存', async () => {
      imageServiceMock.saveImage.mockResolvedValue(undefined);
      const blob = new Blob(['x']);
      const thumbnail = new Blob(['t']);

      const res = await send({ type: MESSAGE_TYPES.SAVE_IMAGE, payload: { blob, thumbnail } });

      expect(res).toEqual({ success: true });
      const record = imageServiceMock.saveImage.mock.calls[0][0];
      expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(record.blob).toBe(blob);
      expect(record.thumbnail).toBe(thumbnail);
      expect(typeof record.timestamp).toBe('number');
    });

    it('儲存失敗時回傳錯誤', async () => {
      imageServiceMock.saveImage.mockRejectedValue(new Error('quota'));

      const res = await send({ type: MESSAGE_TYPES.SAVE_IMAGE, payload: { blob: new Blob(['x']) } });

      expect(res).toEqual({ success: false, error: 'quota' });
    });
  });

  describe('CAPTURE_SCREENSHOT', () => {
    it('尚未實作，回傳失敗', async () => {
      const res = await send({ type: MESSAGE_TYPES.CAPTURE_SCREENSHOT, payload: { tabId: 1 } });
      expect(res).toEqual({ success: false, error: 'Not implemented yet' });
    });
  });

  describe('CAPTURE_TAB', () => {
    it('對最後聚焦的視窗截圖並回傳 dataUrl', async () => {
      chromeMock.windows.getLastFocused.mockResolvedValue({ id: 7, type: 'normal' });
      chromeMock.tabs.captureVisibleTab.mockResolvedValue('data:image/png;base64,AAA');

      const res = await send({ type: MESSAGE_TYPES.CAPTURE_TAB });

      expect(chromeMock.tabs.captureVisibleTab).toHaveBeenCalledWith(7, { format: 'png' });
      expect(res).toEqual({ success: true, dataUrl: 'data:image/png;base64,AAA' });
    });

    it('找不到聚焦視窗時回傳錯誤，且不截圖', async () => {
      chromeMock.windows.getLastFocused.mockResolvedValue({});

      const res = await send({ type: MESSAGE_TYPES.CAPTURE_TAB });

      expect(res).toEqual({ success: false, error: { message: 'No focused window found' } });
      expect(chromeMock.tabs.captureVisibleTab).not.toHaveBeenCalled();
    });

    it('截圖結果為空時回傳錯誤', async () => {
      chromeMock.windows.getLastFocused.mockResolvedValue({ id: 1 });
      chromeMock.tabs.captureVisibleTab.mockResolvedValue('');

      const res = await send({ type: MESSAGE_TYPES.CAPTURE_TAB });

      expect(res).toEqual({ success: false, error: { message: 'No data captured' } });
    });

    it('captureVisibleTab 拋出 Error 時帶回其訊息', async () => {
      chromeMock.windows.getLastFocused.mockResolvedValue({ id: 1 });
      chromeMock.tabs.captureVisibleTab.mockRejectedValue(new Error('cannot capture chrome://'));

      const res = await send({ type: MESSAGE_TYPES.CAPTURE_TAB });

      expect(res).toEqual({ success: false, error: { message: 'cannot capture chrome://' } });
    });

    it('拋出非 Error 值時轉成字串', async () => {
      chromeMock.windows.getLastFocused.mockResolvedValue({ id: 1 });
      chromeMock.tabs.captureVisibleTab.mockRejectedValue('boom');

      const res = await send({ type: MESSAGE_TYPES.CAPTURE_TAB });

      expect(res).toEqual({ success: false, error: { message: 'boom' } });
    });
  });

  describe('AI_SYNTHESIZE', () => {
    const personalBlob = new Blob(['person']);
    const payload = {
      personalPhotoDataUrl: 'data:image/png;base64,AAA',
      clothingDataUrl: 'data:image/png;base64,BBB',
      apiKey: 'key',
      model: 'gemini-3.1-flash-image-preview',
    };
    const generated = new Blob(['result'], { type: 'image/png' });

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(personalBlob) }));
      imageServiceMock.saveImage.mockResolvedValue(undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('成功：把 data URL 轉成 Blob 後合成、存入相片集、發出完成通知', async () => {
      geminiServiceMock.synthesizeImage.mockResolvedValue({ success: true, imageBlob: generated });

      const res = await send({ type: MESSAGE_TYPES.AI_SYNTHESIZE, payload });

      expect(fetch).toHaveBeenCalledWith(payload.personalPhotoDataUrl);
      expect(geminiServiceMock.synthesizeImage).toHaveBeenCalledWith(
        personalBlob,
        payload.clothingDataUrl,
        'key',
        'gemini-3.1-flash-image-preview'
      );
      const record = imageServiceMock.saveImage.mock.calls[0][0];
      expect(record).toMatchObject({ blob: generated, isFavorite: false });
      expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(notificationServiceMock.showSynthesisComplete).toHaveBeenCalledTimes(1);
      expect(notificationServiceMock.showError).not.toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });

    it('合成失敗：發出錯誤通知、不存檔，並回傳錯誤訊息', async () => {
      geminiServiceMock.synthesizeImage.mockResolvedValue({ success: false, error: 'API error: 403' });

      const res = await send({ type: MESSAGE_TYPES.AI_SYNTHESIZE, payload });

      expect(notificationServiceMock.showError).toHaveBeenCalledWith('API error: 403');
      expect(imageServiceMock.saveImage).not.toHaveBeenCalled();
      expect(notificationServiceMock.showSynthesisComplete).not.toHaveBeenCalled();
      expect(res).toEqual({ success: false, error: 'API error: 403' });
    });

    it('合成失敗但沒有訊息：通知使用 Unknown error', async () => {
      geminiServiceMock.synthesizeImage.mockResolvedValue({ success: false });

      await send({ type: MESSAGE_TYPES.AI_SYNTHESIZE, payload });

      expect(notificationServiceMock.showError).toHaveBeenCalledWith('Unknown error');
    });

    it('存入相片集失敗：發出錯誤通知並回傳錯誤', async () => {
      geminiServiceMock.synthesizeImage.mockResolvedValue({ success: true, imageBlob: generated });
      imageServiceMock.saveImage.mockRejectedValue(new Error('quota'));

      const res = await send({ type: MESSAGE_TYPES.AI_SYNTHESIZE, payload });

      expect(notificationServiceMock.showError).toHaveBeenCalledWith('quota');
      expect(notificationServiceMock.showSynthesisComplete).not.toHaveBeenCalled();
      expect(res).toEqual({ success: false, error: 'quota' });
    });

    it('讀取個人照片失敗：不呼叫 Gemini，發出錯誤通知', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('bad data url')));

      const res = await send({ type: MESSAGE_TYPES.AI_SYNTHESIZE, payload });

      expect(geminiServiceMock.synthesizeImage).not.toHaveBeenCalled();
      expect(notificationServiceMock.showError).toHaveBeenCalledWith('bad data url');
      expect(res).toEqual({ success: false, error: 'bad data url' });
    });

    it('拋出非 Error 值時轉成字串', async () => {
      geminiServiceMock.synthesizeImage.mockRejectedValue('boom');

      const res = await send({ type: MESSAGE_TYPES.AI_SYNTHESIZE, payload });

      expect(res).toEqual({ success: false, error: 'boom' });
    });
  });

  it('未知訊息類型回傳失敗', async () => {
    const res = await send({ type: 'NOPE' });
    expect(res).toEqual({ success: false, error: 'Unknown message type' });
  });
});
