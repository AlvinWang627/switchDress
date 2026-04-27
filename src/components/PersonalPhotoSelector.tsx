import { Icon } from '@iconify/react';
import type { PersonalPhoto } from '@/types';

interface PersonalPhotoSelectorProps {
  photos: PersonalPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSettingsClick: () => void;
  isLoading?: boolean;
}

function PersonalPhotoSelector({
  photos,
  selectedId,
  onSelect,
  onSettingsClick,
  isLoading,
}: PersonalPhotoSelectorProps) {
  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-sm text-center">
        <div className="text-gray-500">載入中...</div>
      </section>
    );
  }

  if (photos.length === 0) {
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
          photos.length === 1 ? 'flex justify-center w-full' : 'grid grid-cols-3 gap-3 w-full'
        }
      >
        {photos.slice(0, 6).map((photo) => (
          <div
            key={photo.id}
            className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all ${
              photos.length === 1 ? 'w-1/3' : ''
            } ${photo.id === selectedId ? 'border-2 border-[#1a73e8]' : 'border border-gray-200 dark:border-gray-700'}`}
            onClick={() => onSelect(photo.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(photo.id)}
          >
            <img
              src={URL.createObjectURL(photo.blob)}
              alt={photo.name}
              className="w-full h-full object-cover"
            />
            {photo.id === selectedId && (
              <div className="absolute top-1 right-1 bg-[#1a73e8] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                <Icon icon="mdi:check" width={14} height={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PersonalPhotoSelector;
