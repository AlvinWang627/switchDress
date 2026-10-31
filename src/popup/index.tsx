import React from 'react';
import { createRoot } from 'react-dom/client';
import { Icon } from '@iconify/react';
import { useScreenshot } from '@/hooks/useScreenshot';
import { usePersonalPhoto } from '@/hooks/usePersonalPhoto';
import { useSettings } from '@/hooks/useSettings';
import { useAISynthesis, type SynthesisStatus } from '@/hooks/useAISynthesis';
import { useNotification } from '@/hooks/useNotification';

import ScreenshotPreview from '@/components/ScreenshotPreview';
import PersonalPhotoSelector from '@/components/PersonalPhotoSelector';
import styles from './index.css?inline';

const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

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
  screenshotBlob?: Blob | null;
  onDeleteScreenshot?: () => void;
}

function ClothingAreaCard({ screenshotBlob, onDeleteScreenshot }: ClothingAreaCardProps) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px] text-center shadow-sm">
      {screenshotBlob ? (
        <div className="w-full h-full max-h-[200px]">
          <ScreenshotPreview blob={screenshotBlob} onDelete={onDeleteScreenshot ?? (() => {})} />
        </div>
      ) : (
        <>
          <h2 className="font-headline-md text-headline-md text-gray-900 dark:text-gray-100 mb-2 font-medium">
            尚無截圖
          </h2>
          <p className="font-body-md text-body-md text-gray-600 dark:text-gray-400">
            在網頁上框選衣服區域進行截圖
          </p>
        </>
      )}
    </section>
  );
}

function AIActionButton({
  disabled,
  status,
  onClick,
}: {
  disabled: boolean;
  status: SynthesisStatus;
  onClick: () => void;
}) {
  const getButtonContent = () => {
    switch (status) {
      case 'synthesizing':
        return (
          <>
            <Icon icon="mdi:loading" className="animate-spin mr-2" width={20} height={20} />
            合成中...
          </>
        );
      case 'success':
        return (
          <>
            <Icon icon="mdi:check" className="mr-2" width={20} height={20} />
            合成完成
          </>
        );
      case 'error':
        return (
          <>
            <Icon icon="mdi:alert-circle" className="mr-2" width={20} height={20} />
            合成失敗
          </>
        );
      default:
        return 'AI 合成';
    }
  };

  return (
    <div className="bottom-0 left-0 right-0 p-6 dark:bg-gray-950/90 backdrop-blur-sm flex justify-center z-40 max-w-lg mx-auto">
      <button
        disabled={disabled || status === 'synthesizing'}
        onClick={onClick}
        className="w-full text-black font-label-lg text-label-lg py-4 px-6 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_15px_rgba(26,115,232,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getButtonContent()}
      </button>
    </div>
  );
}

function PopupApp() {
  const { screenshots, capture, remove } = useScreenshot();
  const { photos, selectedPhoto, isLoading, selectPhoto } = usePersonalPhoto();
  const { settings } = useSettings();
  const { status, synthesize, reset } = useAISynthesis();
  const { showSynthesisComplete, showError } = useNotification();

  const handleAlbumClick = () => {
    console.log('Album clicked');
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.tabs.create({ url: chrome.runtime.getURL('gallery/index.html') });
    } else {
      window.open('/src/gallery/index.html', '_blank');
    }
  };

  const handleCameraClick = () => {
    capture();
  };

  const handleSettingsClick = () => {
    console.log('Settings button clicked');
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage(() => {
          if (chrome.runtime.lastError) {
            console.error('Error opening options:', chrome.runtime.lastError);
            chrome.tabs.create({ url: chrome.runtime.getURL('options/index.html') });
          }
        });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('options/index.html') });
      }
    } else {
      console.log('Settings clicked (non-extension environment)');
      // For development environment (Vite serves from root)
      window.open('/src/options/index.html', '_blank');
    }
  };

  const handleAISynthesize = async () => {
    if (!selectedPhoto || !screenshots[0]) return;

    try {
      await synthesize(
        selectedPhoto.blob,
        screenshots[0].blob,
        settings.apiKey,
        settings.model
      );
    } catch (e) {
      console.error('Synthesis failed', e);
    }
  };

  // Handle status changes
  React.useEffect(() => {
    if (status === 'success') {
      showSynthesisComplete();
      // Reset to idle after a short delay
      setTimeout(() => reset(), 2000);
    } else if (status === 'error') {
      showError('AI合成失敗，請重試');
      setTimeout(() => reset(), 3000);
    }
  }, [status, showSynthesisComplete, showError, reset]);

  const canSynthesize = selectedPhoto && screenshots[0] && settings.apiKey;

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen flex flex-col bg-background">
      <Header
        onAlbumClick={handleAlbumClick}
        onCameraClick={handleCameraClick}
        onSettingsClick={handleSettingsClick}
      />

      <main className="flex-grow flex flex-col p-4 gap-4">
        <ClothingAreaCard
          screenshotBlob={screenshots[0]?.blob ?? null}
          onDeleteScreenshot={() => remove(0)}
        />

        {/* ScreenshotOverlay is now rendered in the content script directly on the webpage */}

        <PersonalPhotoSelector
          photos={photos}
          selectedId={selectedPhoto?.id ?? null}
          onSelect={selectPhoto}
          onSettingsClick={handleSettingsClick}
          isLoading={isLoading}
        />
        <AIActionButton
          disabled={!canSynthesize}
          status={status}
          onClick={handleAISynthesize}
        />
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<PopupApp />);
}

export default PopupApp;
