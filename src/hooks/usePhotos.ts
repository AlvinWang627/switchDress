import { useState, useEffect, useCallback } from 'react';
import { savePhoto, getPhotos, deletePhoto, getPhotoCount } from '@/services/photoService';
import type { PersonalPhoto } from '@/types';

interface UsePhotosReturn {
  photos: PersonalPhoto[];
  isLoading: boolean;
  error: Error | null;
  savePhoto: (blob: Blob, name: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  canAddMore: boolean;
  photoCount: number;
}

export function usePhotos(): UsePhotosReturn {
  const [photos, setPhotos] = useState<PersonalPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [photoCount, setPhotoCount] = useState(0);

  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allPhotos = await getPhotos();
      const count = await getPhotoCount();
      setPhotos(allPhotos);
      setPhotoCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('載入照片失敗'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSavePhoto = useCallback(
    async (blob: Blob, name: string) => {
      try {
        setError(null);
        await savePhoto(blob, name);
        await fetchPhotos();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('上傳照片失敗'));
        throw err;
      }
    },
    [fetchPhotos]
  );

  const handleDeletePhoto = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await deletePhoto(id);
        await fetchPhotos();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('刪除照片失敗'));
        throw err;
      }
    },
    [fetchPhotos]
  );

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return {
    photos,
    isLoading,
    error,
    savePhoto: handleSavePhoto,
    deletePhoto: handleDeletePhoto,
    canAddMore: photoCount < 3,
    photoCount,
  };
}
