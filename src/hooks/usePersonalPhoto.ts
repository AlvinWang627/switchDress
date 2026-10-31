import { useState, useEffect, useCallback } from 'react';
import { getPhotos } from '@/services/photoService';
import type { PersonalPhoto } from '@/types';

interface UsePersonalPhotoReturn {
  photos: PersonalPhoto[];
  selectedPhoto: PersonalPhoto | null;
  isLoading: boolean;
  error: Error | null;
  selectPhoto: (id: string) => void;
  refresh: () => Promise<void>;
}

export function usePersonalPhoto(): UsePersonalPhotoReturn {
  const [photos, setPhotos] = useState<PersonalPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allPhotos = await getPhotos();
      setPhotos(allPhotos);
      if (allPhotos.length === 1 && !selectedId) {
        setSelectedId(allPhotos[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('載入個人照片失敗'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const selectPhoto = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const selectedPhoto = photos.find((p) => p.id === selectedId) ?? null;

  return {
    photos,
    selectedPhoto,
    isLoading,
    error,
    selectPhoto,
    refresh: fetchPhotos,
  };
}
