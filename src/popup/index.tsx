import React from 'react';
import { createRoot } from 'react-dom/client';
import { Icon } from '@iconify/react';
import { useImageStorage } from '@/hooks/useImageStorage';
import styles from './index.css?inline';

const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

import type { ImageRecord } from '@/types/popup';

interface HeaderProps {
  onAlbumClick: () => void;
  onCameraClick: () => void;
  onSettingsClick: () => void;
}

function Header({ onAlbumClick, onCameraClick, onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <h1 className="font-headline-lg text-headline-lg text-[#1a73e8] font-bold tracking-tight">
        switchDress
      </h1>
      <div className="flex items-center gap-3 text-gray-800 dark:text-gray-200">
        <button
          aria-label="Album"
          onClick={onAlbumClick}
          className="hover:opacity-70 transition-opacity active:scale-95 duration-200 p-1"
        >
          <Icon icon="mdi:image-multiple-outline" width={26} height={26} />
        </button>
        <button
          aria-label="Camera"
          onClick={onCameraClick}
          className="hover:opacity-70 transition-opacity active:scale-95 duration-200 p-1"
        >
          <Icon icon="mdi:camera-outline" width={26} height={26} />
        </button>
        <button
          aria-label="Settings"
          onClick={onSettingsClick}
          className="hover:opacity-70 transition-opacity active:scale-95 duration-200 p-1"
        >
          <Icon icon="mdi:cog-outline" width={26} height={26} />
        </button>
      </div>
    </header>
  );
}

interface ClothingAreaCardProps {
  hasScreenshot: boolean;
}

function ClothingAreaCard({ hasScreenshot }: ClothingAreaCardProps) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px] text-center shadow-sm">
      {hasScreenshot ? (
        <p className="font-body-md text-body-md text-gray-900 dark:text-gray-100">已選擇服裝區域</p>
      ) : (
        <>
          <h2 className="font-headline-md text-headline-md text-gray-900 dark:text-gray-100 mb-2 font-medium">尚無截圖</h2>
          <p className="font-body-md text-body-md text-gray-600 dark:text-gray-400">在網頁上框選衣服區域進行截圖</p>
        </>
      )}
    </section>
  );
}

interface PhotoOptionProps {
  image: ImageRecord;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function PhotoOption({ image, isSelected, onSelect }: PhotoOptionProps) {
  const handleClick = () => onSelect(image.id);

  return (
    <div
      className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all p-1 ${
        isSelected ? 'border-2 border-[#1a73e8]' : 'border border-gray-200 dark:border-gray-700'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="w-full h-full rounded-lg overflow-hidden">
        <img
          src={image.thumbnail ? URL.createObjectURL(image.thumbnail) : URL.createObjectURL(image.blob)}
          alt="Portrait"
          className="w-full h-full object-cover"
        />
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-[#1a73e8] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          <Icon icon="mdi:check" width={14} height={14} />
        </div>
      )}
    </div>
  );
}

interface PersonalPhotoSectionProps {
  images: ImageRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSettingsClick: () => void;
}

function PersonalPhotoSection({
  images,
  selectedId,
  onSelect,
  onSettingsClick,
}: PersonalPhotoSectionProps) {
  if (images.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-sm text-center">
        <div className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-gray-900 dark:text-gray-100 font-medium">
            尚未上傳相片
          </h2>
        </div>
        <button
          onClick={onSettingsClick}
          className="mt-2 text-[#1a73e8] font-label-md hover:opacity-70 transition-opacity flex items-center gap-1"
        >
          前往設定 <Icon icon="mdi:chevron-right" />
        </button>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center gap-6 shadow-sm">
      <h2 className="font-label-lg text-label-lg text-gray-900 dark:text-gray-100 font-medium">
        請選擇個人照片
      </h2>
      <div
        className={
          images.length === 1 ? 'flex justify-center w-full' : 'grid grid-cols-3 gap-3 w-full'
        }
      >
        {images.slice(0, 6).map((image) => (
          <div key={image.id} className={images.length === 1 ? 'w-1/3' : ''}>
            <PhotoOption
              image={image}
              isSelected={image.id === selectedId}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function AIActionButton({ disabled }: { disabled: boolean }) {
  return (
    <div className="bottom-0 left-0 right-0 p-6 dark:bg-gray-950/90 backdrop-blur-sm flex justify-center z-40 max-w-lg mx-auto">
      <button
        disabled={disabled}
        className="w-full text-black font-label-lg text-label-lg py-4 px-6 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_15px_rgba(26,115,232,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        AI 合成
      </button>
    </div>
  );
}

function PopupApp() {
  const { images, isLoading } = useImageStorage();
  const [selectedPhotoId, setSelectedPhotoId] = React.useState<string | null>(null);
  const [hasScreenshot] = React.useState(false);

  const handleAlbumClick = () => {
    console.log('Album clicked');
  };

  const handleCameraClick = () => {
    console.log('Camera clicked');
  };

  const handleSettingsClick = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      console.log('Settings clicked');
    }
  };

  const handlePhotoSelect = (id: string) => {
    setSelectedPhotoId(id);
  };

  React.useEffect(() => {
    if (images.length === 1 && !selectedPhotoId) {
      setSelectedPhotoId(images[0].id);
    }
  }, [images, selectedPhotoId]);

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen flex flex-col bg-background">
      <Header
        onAlbumClick={handleAlbumClick}
        onCameraClick={handleCameraClick}
        onSettingsClick={handleSettingsClick}
      />

      <main className="flex-grow flex flex-col p-4 gap-4">
        <ClothingAreaCard hasScreenshot={hasScreenshot} />

        {isLoading ? (
          <div className="text-center text-sm text-gray-500">載入中...</div>
        ) : (
          <PersonalPhotoSection
            images={images}
            selectedId={selectedPhotoId}
            onSelect={handlePhotoSelect}
            onSettingsClick={handleSettingsClick}
          />
        )}
        <AIActionButton disabled={!selectedPhotoId} />
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<PopupApp />);
}

export default PopupApp;