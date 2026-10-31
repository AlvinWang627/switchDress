import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  geminiService: { synthesizeImage: vi.fn() },
  imageService: { saveImage: vi.fn() },
}));
vi.mock('@/services/geminiService', () => ({ geminiService: mocks.geminiService }));
vi.mock('@/services/imageService', () => ({ imageService: mocks.imageService }));

import { useAISynthesis } from '@/hooks/useAISynthesis';

const personal = new Blob(['p']);
const clothing = new Blob(['c']);
const generated = new Blob(['g'], { type: 'image/png' });

const run = (result: { current: ReturnType<typeof useAISynthesis> }) =>
  act(() => result.current.synthesize(personal, clothing, 'key', 'model'));

describe('useAISynthesis', () => {
  beforeEach(() => {
    mocks.geminiService.synthesizeImage.mockReset().mockResolvedValue({ success: true, imageBlob: generated });
    mocks.imageService.saveImage.mockReset().mockResolvedValue(undefined);
  });

  it('初始為 idle 且沒有錯誤', () => {
    const { result } = renderHook(() => useAISynthesis());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  describe('成功', () => {
    it('以參數呼叫 Gemini，並把結果存入相片集（isFavorite 預設 false）', async () => {
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(mocks.geminiService.synthesizeImage).toHaveBeenCalledWith(personal, clothing, 'key', 'model');
      const record = mocks.imageService.saveImage.mock.calls[0][0];
      expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(record.blob).toBe(generated);
      expect(record.isFavorite).toBe(false);
      expect(typeof record.timestamp).toBe('number');
      expect(result.current.status).toBe('success');
      expect(result.current.error).toBeNull();
    });

    it('呼叫期間狀態為 synthesizing', async () => {
      let resolve!: (v: unknown) => void;
      mocks.geminiService.synthesizeImage.mockReturnValue(new Promise((r) => (resolve = r)));
      const { result } = renderHook(() => useAISynthesis());

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.synthesize(personal, clothing, 'key', 'model');
      });
      expect(result.current.status).toBe('synthesizing');

      await act(async () => {
        resolve({ success: true, imageBlob: generated });
        await pending;
      });
      expect(result.current.status).toBe('success');
    });
  });

  describe('失敗', () => {
    it('Gemini 回報失敗：status 為 error 並保留訊息，不存入相片集', async () => {
      mocks.geminiService.synthesizeImage.mockResolvedValue({ success: false, error: 'API error: 429' });
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('API error: 429');
      expect(mocks.imageService.saveImage).not.toHaveBeenCalled();
    });

    it('失敗但沒有訊息時使用 Unknown error', async () => {
      mocks.geminiService.synthesizeImage.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(result.current.error).toBe('Unknown error');
    });

    it('回報成功卻沒有圖片時視為失敗', async () => {
      mocks.geminiService.synthesizeImage.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(result.current.status).toBe('error');
      expect(mocks.imageService.saveImage).not.toHaveBeenCalled();
    });

    it('Gemini 拋出 Error：帶回其訊息', async () => {
      mocks.geminiService.synthesizeImage.mockRejectedValue(new Error('network'));
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('network');
    });

    it('拋出非 Error 值：使用 Unknown error', async () => {
      mocks.geminiService.synthesizeImage.mockRejectedValue('x');
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(result.current.error).toBe('Unknown error');
    });

    it('存入相片集失敗時視為失敗', async () => {
      mocks.imageService.saveImage.mockRejectedValue(new Error('quota exceeded'));
      const { result } = renderHook(() => useAISynthesis());

      await run(result);

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('quota exceeded');
    });

    it('重新合成時會清掉上一次的錯誤', async () => {
      mocks.geminiService.synthesizeImage.mockResolvedValueOnce({ success: false, error: 'first' });
      const { result } = renderHook(() => useAISynthesis());
      await run(result);
      expect(result.current.error).toBe('first');

      await run(result);

      expect(result.current.status).toBe('success');
      expect(result.current.error).toBeNull();
    });
  });

  it('reset 回到 idle 並清除錯誤', async () => {
    mocks.geminiService.synthesizeImage.mockResolvedValue({ success: false, error: 'bad' });
    const { result } = renderHook(() => useAISynthesis());
    await run(result);

    act(() => result.current.reset());

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});
