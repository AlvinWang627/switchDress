import React from 'react';
import { createRoot } from 'react-dom/client';
import { Icon } from '@iconify/react';
import MasonryGallery from '@/components/MasonryGallery';
import { imageService } from '@/services/imageService';
import type { ImageRecord } from '@/types/popup';
import styles from './index.css?inline';

const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);
function GalleryHeader() {
  const handleBack = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      window.close();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="hover:opacity-70 transition-opacity p-1"
          aria-label="返回"
        >
          <Icon icon="mdi:arrow-left" width={24} height={24} />
        </button>
        <h1 className="font-headline-lg text-headline-lg text-[#1a73e8] font-bold tracking-tight">
          相片集
        </h1>
      </div>
    </header>
  );
}

function GalleryPage() {
  const [images, setImages] = React.useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadImages = React.useCallback(async () => {
    try {
      const allImages = await imageService.getAllImagesSorted();
      setImages(allImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleDelete = async (id: string) => {
    try {
      await imageService.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (!image) return;

    try {
      await imageService.updateImage(id, { isFavorite: !image.isFavorite });
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, isFavorite: !img.isFavorite } : img))
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GalleryHeader />
      <main className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-gray-500">載入中...</div>
          </div>
        ) : (
          <MasonryGallery
            images={images}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<GalleryPage />);
}

export default GalleryPage;
