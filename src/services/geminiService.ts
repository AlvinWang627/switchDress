import type { SynthesisResult } from '@/types/provider';
import { base64ToBlob, blobToDataUrl, dataUrlToBase64 } from '@/utils/blob';
import { TRY_ON_PROMPT } from './prompts';

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export type { SynthesisResult };

async function blobToBase64(blob: Blob): Promise<string> {
  return dataUrlToBase64(await blobToDataUrl(blob));
}

export async function synthesizeImage(
  personalPhotoBlob: Blob,
  clothingBlob: Blob,
  apiKey: string,
  model: string
): Promise<SynthesisResult> {
  try {
    // Convert both blobs to base64
    const personalPhotoBase64 = await blobToBase64(personalPhotoBlob);
    const clothingBase64 = await blobToBase64(clothingBlob);

    const endpoint = `${API_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: TRY_ON_PROMPT,
              },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: clothingBase64,
                },
              },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: personalPhotoBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    // Extract generated image from response
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts
    ) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        const inlineData = part.inline_data || part.inlineData;
        if (inlineData && inlineData.data) {
          const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
          return {
            success: true,
            imageBlob: base64ToBlob(inlineData.data, mimeType),
          };
        }
      }
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

export const geminiService = {
  synthesizeImage,
};
