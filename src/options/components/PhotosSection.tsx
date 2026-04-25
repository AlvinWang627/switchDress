import { useState } from 'react';
import { Icon } from '@iconify/react';
import { PhotoSlot } from './PhotoSlot';
import { PhotoUploader } from './PhotoUploader';
import { usePhotos } from '@/hooks/usePhotos';
import { validatePhoto } from '@/utils/validation';

interface PhotosSectionProps {
  onUploadSuccess?: () => void;
  onUploadError?: (error: Error) => void;
}

export function PhotosSection({ onUploadSuccess, onUploadError }: PhotosSectionProps) {
  const { photos, isLoading, savePhoto, deletePhoto, canAddMore } = usePhotos();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleFileSelect = async (file: File) => {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const validation = validatePhoto(blob);

    if (!validation.valid) {
      setToastMessage(validation.error || '無效的檔案');
      setToastType('error');
      setShowToast(true);
      onUploadError?.(new Error(validation.error));
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      await savePhoto(blob, file.name);
      setToastMessage('照片上傳成功');
      setToastType('success');
      setShowToast(true);
      onUploadSuccess?.();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : '上傳失敗');
      setToastType('error');
      setShowToast(true);
      onUploadError?.(err instanceof Error ? err : new Error('上傳失敗'));
    }

    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhoto(id);
      setToastMessage('照片已刪除');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage('刪除失敗');
      setToastType('error');
      setShowToast(true);
    }
    setTimeout(() => setShowToast(false), 3000);
  };

  if (isLoading) {
    return (
      <section className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-gray-200 rounded"></div>
            <div className="aspect-square bg-gray-200 rounded"></div>
            <div className="aspect-square bg-gray-200 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">個人照片</h2>
        <span className="text-sm text-gray-500">{photos.length}/3</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2].map((index) => (
          <PhotoSlot
            key={index}
            photo={photos[index]}
            onDelete={handleDelete}
            disabled={!canAddMore && !photos[index]}
          />
        ))}
      </div>

      {canAddMore ? (
        <PhotoUploader onFileSelect={handleFileSelect} disabled={!canAddMore} />
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
          <Icon icon="mdi:information" className="w-5 h-5" />
          已達照片數量上限（3 張）
        </div>
      )}

      {showToast && (
        <div
          className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}
        >
          <Icon
            icon={toastType === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="w-5 h-5"
          />
          {toastMessage}
        </div>
      )}
    </section>
  );
}
