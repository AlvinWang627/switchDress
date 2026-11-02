import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { synthesizeImage, openRouterService } from '@/services/openRouterService';

const personal = new Blob(['abc'], { type: 'image/png' }); // base64: YWJj
const clothing = new Blob(['xyz'], { type: 'image/png' }); // base64: eHl6

const okResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(''),
});

/** 一張內容為 "hi" 的圖片（base64: aGk=） */
const imageBody = (
  item: Record<string, string> = { b64_json: 'aGk=', media_type: 'image/png' }
) => ({
  created: 1,
  data: [item],
});

describe('openRouterService.synthesizeImage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(okResponse(imageBody()));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('請求', () => {
    it('以 POST 呼叫 /api/v1/images，並以 Bearer 帶入 API Key', async () => {
      await synthesizeImage(personal, clothing, 'or-key', 'qwen/qwen-image-2.1-pro');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://openrouter.ai/api/v1/images');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer or-key',
      });
    });

    it('送出模型、提示詞，以及依序為衣服、個人照的 data URL 參考圖', async () => {
      await synthesizeImage(personal, clothing, 'k', 'qwen/qwen-image-3');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.model).toBe('qwen/qwen-image-3');
      expect(body.prompt).toContain('Virtual try-on');
      expect(body.input_references).toEqual([
        { type: 'image_url', image_url: { url: 'data:image/png;base64,eHl6' } },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,YWJj' } },
      ]);
    });
  });

  describe('成功', () => {
    it('把 b64_json 解碼為 Blob（含 MIME 與大小）', async () => {
      fetchMock.mockResolvedValue(
        okResponse(imageBody({ b64_json: 'aGk=', media_type: 'image/webp' }))
      );

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.success).toBe(true);
      expect(result.imageBlob?.type).toBe('image/webp');
      expect(result.imageBlob?.size).toBe(2); // "hi"
    });

    it('沒有 media_type 時預設為 image/png', async () => {
      fetchMock.mockResolvedValue(okResponse(imageBody({ b64_json: 'aGk=' })));

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.imageBlob?.type).toBe('image/png');
    });

    it('b64_json 帶有 data URL 前綴時仍可解碼', async () => {
      fetchMock.mockResolvedValue(
        okResponse(imageBody({ b64_json: 'data:image/png;base64,aGk=' }))
      );

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.imageBlob?.size).toBe(2);
    });

    it('略過沒有 b64_json 的項目，取第一個有資料的', async () => {
      fetchMock.mockResolvedValue(okResponse({ data: [{}, { b64_json: 'aGk=' }] }));

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.success).toBe(true);
    });
  });

  describe('失敗', () => {
    it('HTTP 非 2xx 時回傳狀態碼與回應內文', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('No auth credentials'),
      });

      const result = await synthesizeImage(personal, clothing, 'bad', 'm');

      expect(result).toEqual({ success: false, error: 'API error: 401 - No auth credentials' });
    });

    it.each([
      ['沒有 data', {}],
      ['data 不是陣列', { data: 'x' }],
      ['data 為空', { data: [] }],
      ['項目沒有 b64_json', { data: [{ media_type: 'image/png' }] }],
    ])('回應%s時回傳「No image generated in response」', async (_label, body) => {
      fetchMock.mockResolvedValue(okResponse(body));

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result).toEqual({ success: false, error: 'No image generated in response' });
    });

    it('網路錯誤時帶回 Error 訊息，不拋出例外', async () => {
      fetchMock.mockRejectedValue(new Error('Failed to fetch'));

      await expect(synthesizeImage(personal, clothing, 'k', 'm')).resolves.toEqual({
        success: false,
        error: 'Failed to fetch',
      });
    });

    it('拋出非 Error 值時使用預設訊息', async () => {
      fetchMock.mockRejectedValue('boom');

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result).toEqual({ success: false, error: 'Unknown error occurred' });
    });

    it('傳入的不是 Blob 時回傳失敗而不送出請求', async () => {
      const notABlob = 'data:image/png;base64,AAA' as unknown as Blob;

      const result = await synthesizeImage(personal, notABlob, 'k', 'm');

      expect(result.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('openRouterService 物件暴露 synthesizeImage', () => {
    expect(openRouterService.synthesizeImage).toBe(synthesizeImage);
  });
});
