// Screenshot preview component with delete functionality

import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ScreenshotPreviewProps } from '@/types/screenshot';

export function ScreenshotPreview({ blob, onDelete }: ScreenshotPreviewProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(blob));
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-full h-full min-h-[150px] rounded-xl overflow-hidden bg-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={imageUrl}
        alt="Screenshot"
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Delete button */}
      <button
        onClick={onDelete}
        className={`absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity shadow-lg ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="刪除截圖"
      >
        <Icon icon="mdi:close" width={18} height={18} />
      </button>
    </div>
  );
}

export default ScreenshotPreview;