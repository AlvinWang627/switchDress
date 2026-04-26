import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import type { ImageRecord } from '@/types/popup';
import GalleryItem from './GalleryItem';

interface MasonryGalleryProps {
  images: ImageRecord[];
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

function MasonryGallery({ images, onDelete, onToggleFavorite }: MasonryGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">尚無合成照片</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          在 Popup 頁面選擇照片進行 AI 合成
        </p>
      </div>
    );
  }

  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
      <Masonry gutter="12px">
        {images.map((image) => (
          <GalleryItem
            key={image.id}
            image={image}
            onDelete={() => onDelete(image.id)}
            onToggleFavorite={() => onToggleFavorite(image.id)}
          />
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export default MasonryGallery;
