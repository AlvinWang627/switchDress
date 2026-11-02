import type { SynthesisResult } from '@/types/provider';
import { base64ToBlob, blobToDataUrl } from '@/utils/blob';
import { TRY_ON_PROMPT } from './prompts';

/** OpenRouter 統一圖片 API（圖片生成與改圖共用，輸出一律為圖片） */
const API_ENDPOINT = 'https://openrouter.ai/api/v1/images';

interface ImageResponseItem {
  b64_json?: string;
  media_type?: string;
}

function toReference(dataUrl: string) {
  return { type: 'image_url', image_url: { url: dataUrl } };
}

/**
 * 透過 OpenRouter 合成圖片。
 * 參考圖順序與 Gemini 相同：先衣服（image A）、後個人照（image B）。
 */
export async function synthesizeImage(
  personalPhotoBlob: Blob,
  clothingBlob: Blob,
  apiKey: string,
  model: string
): Promise<SynthesisResult> {
  try {
    const personalPhotoDataUrl = await blobToDataUrl(personalPhotoBlob);
    const clothingDataUrl = await blobToDataUrl(clothingBlob);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: TRY_ON_PROMPT,
        input_references: [toReference(clothingDataUrl), toReference(personalPhotoDataUrl)],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const body = await response.json();
    const items: ImageResponseItem[] = Array.isArray(body?.data) ? body.data : [];
    const item = items.find((entry) => entry?.b64_json);

    if (item?.b64_json) {
      // 防禦：若回傳的是完整 data URL，去掉前綴再解碼
      const base64 = item.b64_json.replace(/^data:[^,]*,/, '');
      return {
        success: true,
        imageBlob: base64ToBlob(base64, item.media_type || 'image/png'),
      };
    }

    return {
      success: false,
      error: 'No image generated in response',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export const openRouterService = {
  synthesizeImage,
};
