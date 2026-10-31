import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { synthesizeImage, geminiService } from '@/services/geminiService';

const personal = new Blob(['abc'], { type: 'image/png' }); // base64: YWJj
const clothing = new Blob(['xyz'], { type: 'image/png' }); // base64: eHl6

const okResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(''),
});

/** 回傳一張內容為 "hi" 的 PNG（base64: aGk=）的 Gemini 回應 */
const imageBody = (inline: Record<string, string> = { mime_type: 'image/png', data: 'aGk=' }, key = 'inline_data') => ({
  candidates: [{ content: { parts: [{ [key]: inline }] } }],
});

describe('geminiService.synthesizeImage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(okResponse(imageBody()));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('請求', () => {
    it('以 POST 呼叫對應模型的 generateContent，並在網址帶入 API Key', async () => {
      await synthesizeImage(personal, clothing, 'my-key', 'gemini-2.5-flash-image');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=my-key'
      );
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('依序送出提示詞、衣服圖、個人照（base64 不含 data URL 前綴）', async () => {
      await synthesizeImage(personal, clothing, 'k', 'm');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      const parts = body.contents[0].parts;
      expect(parts[0].text).toContain('Virtual try-on');
      expect(parts[1].inline_data).toEqual({ mime_type: 'image/png', data: 'eHl6' });
      expect(parts[2].inline_data).toEqual({ mime_type: 'image/png', data: 'YWJj' });
    });

    it('要求回傳圖片', async () => {
      await synthesizeImage(personal, clothing, 'k', 'm');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.generationConfig).toEqual({ responseModalities: ['IMAGE'] });
    });
  });

  describe('成功', () => {
    it('把 base64 圖片解碼為 Blob（含 MIME 與大小）', async () => {
      fetchMock.mockResolvedValue(okResponse(imageBody({ mime_type: 'image/jpeg', data: 'aGk=' })));

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.success).toBe(true);
      expect(result.imageBlob?.type).toBe('image/jpeg');
      expect(result.imageBlob?.size).toBe(2); // "hi"
    });

    it('相容 camelCase 欄位（inlineData / mimeType）', async () => {
      fetchMock.mockResolvedValue(okResponse(imageBody({ mimeType: 'image/webp', data: 'aGk=' }, 'inlineData')));

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.success).toBe(true);
      expect(result.imageBlob?.type).toBe('image/webp');
    });

    it('沒有指定 MIME 時預設為 image/png', async () => {
      fetchMock.mockResolvedValue(okResponse(imageBody({ data: 'aGk=' })));

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.imageBlob?.type).toBe('image/png');
    });

    it('略過文字區塊，取第一個帶資料的圖片區塊', async () => {
      fetchMock.mockResolvedValue(
        okResponse({
          candidates: [
            {
              content: {
                parts: [{ text: 'here you go' }, { inline_data: { mime_type: 'image/png', data: 'aGk=' } }],
              },
            },
          ],
        })
      );

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result.success).toBe(true);
    });
  });

  describe('失敗', () => {
    it('HTTP 非 2xx 時回傳狀態碼與回應內文', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('API key not valid'),
      });

      const result = await synthesizeImage(personal, clothing, 'bad', 'm');

      expect(result).toEqual({ success: false, error: 'API error: 403 - API key not valid' });
    });

    it.each([
      ['沒有 candidates', {}],
      ['candidates 為空', { candidates: [] }],
      ['沒有 content', { candidates: [{}] }],
      ['沒有 parts', { candidates: [{ content: {} }] }],
      ['只有文字區塊', { candidates: [{ content: { parts: [{ text: 'sorry' }] } }] }],
      ['圖片區塊沒有 data', { candidates: [{ content: { parts: [{ inline_data: { mime_type: 'image/png' } }] } }] }],
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

    it('回應不是合法 JSON 時回傳失敗', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) });

      const result = await synthesizeImage(personal, clothing, 'k', 'm');

      expect(result).toEqual({ success: false, error: 'bad json' });
    });

    it('傳入的不是 Blob 時回傳失敗而不送出請求', async () => {
      const notABlob = 'data:image/png;base64,AAA' as unknown as Blob;

      const result = await synthesizeImage(personal, notABlob, 'k', 'm');

      expect(result.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('geminiService 物件暴露 synthesizeImage', () => {
    expect(geminiService.synthesizeImage).toBe(synthesizeImage);
  });
});
