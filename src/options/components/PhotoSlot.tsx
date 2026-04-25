import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { PersonalPhoto } from '@/types';

interface PhotoSlotProps {
  photo?: PersonalPhoto;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export function PhotoSlot({ photo, onDelete, disabled }: PhotoSlotProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  if (photo && !imageUrl) {
    setImageUrl(URL.createObjectURL(photo.blob));
  }

  if (!photo) {
    return (
      <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <Icon icon="mdi:image-plus" className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
      <img
        src={imageUrl || ''}
        alt={photo.name || '個人照片'}
        className="w-full h-full object-cover"
      />
      {onDelete && (
        <button
          onClick={() => onDelete(photo.id)}
          disabled={disabled}
          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="刪除照片"
        >
          <Icon icon="mdi:close" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
