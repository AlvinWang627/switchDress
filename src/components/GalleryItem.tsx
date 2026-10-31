import { Icon } from '@iconify/react';
import type { ImageRecord } from '@/types/popup';

interface GalleryItemProps {
  image: ImageRecord;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function GalleryItem({ image, onDelete, onToggleFavorite }: GalleryItemProps) {
  const imageUrl = URL.createObjectURL(image.blob);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img
        src={imageUrl}
        alt="Gallery item"
        className="w-full h-auto block"
        loading="lazy"
      />

      {/* Favorite button - top left */}
      <button
        onClick={onToggleFavorite}
        className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        aria-label={image.isFavorite ? '取消最愛' : '標記最愛'}
      >
        <Icon
          icon={image.isFavorite ? 'mdi:star' : 'mdi:star-outline'}
          width={18}
          height={18}
          className={image.isFavorite ? 'text-yellow-400' : 'text-white'}
        />
      </button>

      {/* Delete button - top right */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-red-600/70 transition-colors"
        aria-label="刪除"
      >
        <Icon icon="mdi:close" width={18} height={18} className="text-white" />
      </button>
    </div>
  );
}

export default GalleryItem;
