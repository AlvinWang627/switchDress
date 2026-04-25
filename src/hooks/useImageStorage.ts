import { useState, useEffect, useCallback } from 'react';
import { imageService } from '@/services/imageService';
import type { ImageRecord } from '@/types/popup';

interface UseImageStorageReturn {
  images: ImageRecord[];
  isLoading: boolean;
  error: Error | null;
  saveImage: (blob: Blob, thumbnail?: Blob) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  refreshImages: () => Promise<void>;
}

export function useImageStorage(): UseImageStorageReturn {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allImages = await imageService.getAllImages();
      setImages(allImages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load images'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveImage = useCallback(async (blob: Blob, thumbnail?: Blob) => {
    try {
      setError(null);
      const record: ImageRecord = {
        id: crypto.randomUUID(),
        blob,
        timestamp: Date.now(),
        thumbnail,
      };
      await imageService.saveImage(record);
      await refreshImages();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save image'));
      throw err;
    }
  }, [refreshImages]);

  const deleteImage = useCallback(async (id: string) => {
    try {
      setError(null);
      await imageService.deleteImage(id);
      await refreshImages();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete image'));
      throw err;
    }
  }, [refreshImages]);

  useEffect(() => {
    refreshImages();
  }, [refreshImages]);

  return {
    images,
    isLoading,
    error,
    saveImage,
    deleteImage,
    refreshImages,
  };
}
