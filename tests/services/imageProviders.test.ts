import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  gemini: { synthesizeImage: vi.fn() },
  openRouter: { synthesizeImage: vi.fn() },
}));
vi.mock('@/services/geminiService', () => ({ geminiService: mocks.gemini }));
vi.mock('@/services/openRouterService', () => ({ openRouterService: mocks.openRouter }));

import {
  DEFAULT_MODEL,
  IMAGE_PROVIDERS,
  getApiKey,
  getProvider,
  getProviderForModel,
  synthesizeImage,
} from '@/services/imageProviders';

const personal = new Blob(['p']);
const clothing = new Blob(['c']);

describe('imageProviders', () => {
  beforeEach(() => {
    mocks.gemini.synthesizeImage.mockReset().mockResolvedValue({ success: true, from: 'gemini' });
    mocks.openRouter.synthesizeImage
      .mockReset()
      .mockResolvedValue({ success: true, from: 'openrouter' });
  });

  it('提供 Gemini 與 OpenRouter 兩個供應商，模型 ID 不重複', () => {
    expect(IMAGE_PROVIDERS.map((p) => p.id)).toEqual(['gemini', 'openrouter']);
    const ids = IMAGE_PROVIDERS.flatMap((p) => p.models.map((m) => m.value));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('預設模型屬於 Gemini，且保留既有使用者可能存的舊模型', () => {
    expect(getProviderForModel(DEFAULT_MODEL).id).toBe('gemini');
    const geminiModels = getProvider('gemini').models.map((m) => m.value);
    expect(geminiModels).toEqual(
      expect.arrayContaining([
        'gemini-nano-banana-2.1',
        'gemini-3-pro-image',
        'gemini-3.1-flash-image-preview',
        'gemini-2.5-flash-image',
      ])
    );
  });

  it('OpenRouter 包含 Qwen 圖片模型', () => {
    const models = getProvider('openrouter').models.map((m) => m.value);
    expect(models).toEqual(
      expect.arrayContaining(['qwen/qwen-image-2.1-pro', 'qwen/qwen-image-3'])
    );
  });

  describe('getProviderForModel', () => {
    it.each([
      ['gemini-nano-banana-2.1', 'gemini'],
      ['qwen/qwen-image-2.1-pro', 'openrouter'],
      ['google/gemini-3-pro-image', 'openrouter'],
      ['unknown-model', 'gemini'],
    ])('%s → %s', (model, provider) => {
      expect(getProviderForModel(model).id).toBe(provider);
    });
  });

  describe('getApiKey', () => {
    it('回傳所選模型供應商的 Key', () => {
      const apiKeys = { gemini: 'g', openrouter: 'o' };
      expect(getApiKey({ model: 'gemini-3-pro-image', apiKeys })).toBe('g');
      expect(getApiKey({ model: 'qwen/qwen-image-3', apiKeys })).toBe('o');
    });

    it('該供應商沒有 Key 時回傳空字串', () => {
      expect(getApiKey({ model: 'qwen/qwen-image-3', apiKeys: { gemini: 'g' } })).toBe('');
    });
  });

  describe('synthesizeImage', () => {
    it('Gemini 模型交給 geminiService', async () => {
      const result = await synthesizeImage(personal, clothing, 'k', 'gemini-3-pro-image');

      expect(mocks.gemini.synthesizeImage).toHaveBeenCalledWith(
        personal,
        clothing,
        'k',
        'gemini-3-pro-image'
      );
      expect(mocks.openRouter.synthesizeImage).not.toHaveBeenCalled();
      expect(result).toMatchObject({ from: 'gemini' });
    });

    it('OpenRouter 模型交給 openRouterService', async () => {
      const result = await synthesizeImage(personal, clothing, 'k', 'qwen/qwen-image-2.1-pro');

      expect(mocks.openRouter.synthesizeImage).toHaveBeenCalledWith(
        personal,
        clothing,
        'k',
        'qwen/qwen-image-2.1-pro'
      );
      expect(mocks.gemini.synthesizeImage).not.toHaveBeenCalled();
      expect(result).toMatchObject({ from: 'openrouter' });
    });
  });
});
