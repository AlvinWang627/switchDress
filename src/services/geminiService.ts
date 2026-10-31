const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface SynthesisResult {
  success: boolean;
  imageBlob?: Blob;
  error?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 part
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
                text: 'Virtual try-on: Put the clothing from image A onto the person in image B. The clothing should naturally drape on the person while preserving the person\'s facial features and body structure.',
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
          const imageData = inlineData.data;
          const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
          const byteCharacters = atob(imageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const imageBlob = new Blob([byteArray], { type: mimeType });
          return {
            success: true,
            imageBlob,
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
