import type { ModelOption, ProviderId, SynthesisResult } from '@/types/provider';
import type { UserSettings } from '@/types';
import { geminiService } from './geminiService';
import { openRouterService } from './openRouterService';

export interface ImageProvider {
  id: ProviderId;
  label: string;
  /** API Key 欄位下方的提示文字 */
  keyHint: string;
  models: ModelOption[];
  synthesizeImage: (
    personalPhotoBlob: Blob,
    clothingBlob: Blob,
    apiKey: string,
    model: string
  ) => Promise<SynthesisResult>;
}

const geminiProvider: ImageProvider = {
  id: 'gemini',
  label: 'Google Gemini（直連）',
  keyHint: '請輸入 Google AI Studio 的 Gemini API Key。',
  // 由新到舊。兩個 *-preview / 舊 ID 保留，避免既有使用者儲存的設定失效。
  models: [
    { value: 'gemini-nano-banana-2.1', label: 'Nano Banana 2.1 (gemini-nano-banana-2.1)' },
    { value: 'gemini-3.1-flash-image', label: 'Nano Banana 2 (gemini-3.1-flash-image)' },
    {
      value: 'gemini-3.1-flash-lite-image',
      label: 'Nano Banana 2 Lite (gemini-3.1-flash-lite-image)',
    },
    { value: 'gemini-3-pro-image', label: 'Nano Banana Pro (gemini-3-pro-image)' },
    {
      value: 'gemini-3.1-flash-image-preview',
      label: 'Nano Banana 2 預覽版 (gemini-3.1-flash-image-preview)',
    },
    { value: 'gemini-2.5-flash-image', label: 'Nano Banana (gemini-2.5-flash-image)' },
  ],
  // 經由函式呼叫而非直接取用，確保依賴被 mock / 替換時仍會生效
  synthesizeImage: (personal, clothing, apiKey, model) =>
    geminiService.synthesizeImage(personal, clothing, apiKey, model),
};

const openRouterProvider: ImageProvider = {
  id: 'openrouter',
  label: 'OpenRouter（多家模型）',
  keyHint:
    '請輸入 OpenRouter API Key。注意：您的個人照片與衣服截圖會經由 OpenRouter 轉送給所選模型的供應商。',
  // 模型 ID 取自 OpenRouter 的 GET /api/v1/images/models，皆支援圖片輸入（改圖）
  models: [
    { value: 'qwen/qwen-image-2.1-pro', label: 'Qwen Image 2.1 Pro' },
    { value: 'qwen/qwen-image-2.1-turbo', label: 'Qwen Image 2.1 Turbo' },
    { value: 'qwen/qwen-image-3', label: 'Qwen Image 3' },
    { value: 'qwen/qwen-image-3-pro', label: 'Qwen Image 3 Pro' },
    { value: 'google/gemini-nano-banana-2.1', label: 'Nano Banana 2.1（Google）' },
    { value: 'google/gemini-3-pro-image', label: 'Nano Banana Pro（Google）' },
    { value: 'openai/gpt-image-2', label: 'GPT Image 2（OpenAI）' },
    { value: 'bytedance-seed/seedream-5-0-pro', label: 'Seedream 5.0 Pro（ByteDance）' },
    { value: 'black-forest-labs/flux-3-image', label: 'FLUX 3 Image（Black Forest Labs）' },
  ],
  synthesizeImage: (personal, clothing, apiKey, model) =>
    openRouterService.synthesizeImage(personal, clothing, apiKey, model),
};

export const IMAGE_PROVIDERS: ImageProvider[] = [geminiProvider, openRouterProvider];

/** 預設模型：維持既有預設，避免升級後行為改變 */
export const DEFAULT_MODEL = 'gemini-3.1-flash-image-preview';

const FALLBACK_PROVIDER = geminiProvider;

export function getProvider(id: ProviderId): ImageProvider {
  return IMAGE_PROVIDERS.find((provider) => provider.id === id) ?? FALLBACK_PROVIDER;
}

/**
 * 依模型 ID 找出所屬供應商。
 * 找不到時回退為 Gemini：此功能加入前儲存的設定只會有 Gemini 模型。
 */
export function getProviderForModel(model: string): ImageProvider {
  return (
    IMAGE_PROVIDERS.find((provider) => provider.models.some((option) => option.value === model)) ??
    FALLBACK_PROVIDER
  );
}

/** 取得目前所選模型對應供應商的 API Key（未設定回傳空字串） */
export function getApiKey(settings: UserSettings): string {
  return settings.apiKeys[getProviderForModel(settings.model).id] ?? '';
}

/** 依模型 ID 分派到對應供應商進行合成 */
export function synthesizeImage(
  personalPhotoBlob: Blob,
  clothingBlob: Blob,
  apiKey: string,
  model: string
): Promise<SynthesisResult> {
  return getProviderForModel(model).synthesizeImage(personalPhotoBlob, clothingBlob, apiKey, model);
}
