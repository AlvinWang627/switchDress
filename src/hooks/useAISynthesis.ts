import { useState, useCallback } from 'react';
import { geminiService } from '@/services/geminiService';
import { imageService } from '@/services/imageService';
import type { ImageRecord } from '@/types/popup';

export type SynthesisStatus = 'idle' | 'capturing' | 'synthesizing' | 'success' | 'error';

interface UseAISynthesisReturn {
  status: SynthesisStatus;
  error: string | null;
  synthesize: (
    personalPhotoBlob: Blob,
    clothingBlob: Blob,
    apiKey: string,
    model: string
  ) => Promise<void>;
  reset: () => void;
}

export function useAISynthesis(): UseAISynthesisReturn {
  const [status, setStatus] = useState<SynthesisStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const synthesize = useCallback(
    async (
      personalPhotoBlob: Blob,
      clothingBlob: Blob,
      apiKey: string,
      model: string
    ): Promise<void> => {
      try {
        setStatus('synthesizing');
        setError(null);

        const result = await geminiService.synthesizeImage(
          personalPhotoBlob,
          clothingBlob,
          apiKey,
          model
        );

        if (result.success && result.imageBlob) {
          // Save to gallery
          const record: ImageRecord = {
            id: crypto.randomUUID(),
            blob: result.imageBlob,
            timestamp: Date.now(),
            isFavorite: false,
          };

          await imageService.saveImage(record);
          setStatus('success');
        } else {
          setError(result.error || 'Unknown error');
          setStatus('error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    error,
    synthesize,
    reset,
  };
}

