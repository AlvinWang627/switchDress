// Screenshot overlay with selection UI

import { useEffect, useCallback, useRef, useState } from 'react';
import type { SelectionRect, ScreenshotOverlayProps } from '@/types/screenshot';
import SelectionBox from './SelectionBox';

export function ScreenshotOverlay({
  imageUrl,
  initialSelection,
  onConfirm,
  onCancel,
  minSize = 50,
  fullScreen = false,
}: ScreenshotOverlayProps) {
  const [displaySelection, setDisplaySelection] = useState<SelectionRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [imageRect, setImageRect] = useState({ width: 0, height: 0, scale: 1 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const updateMeasurements = useCallback(() => {
    if (imgRef.current) {
      const { clientWidth, clientHeight, naturalWidth } = imgRef.current;
      if (naturalWidth > 0 && clientWidth > 0) {
        const scale = clientWidth / naturalWidth;
        setImageRect({
          width: clientWidth,
          height: clientHeight,
          scale,
        });

        // Initialize display selection based on natural selection and scale
        setDisplaySelection({
          x: initialSelection.x * scale,
          y: initialSelection.y * scale,
          width: initialSelection.width * scale,
          height: initialSelection.height * scale,
        });
      }
    }
  }, [initialSelection]);

  useEffect(() => {
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [updateMeasurements]);

  const handleSelectionChange = useCallback((newDisplaySelection: SelectionRect) => {
    setDisplaySelection(newDisplaySelection);
  }, []);

  const handleConfirm = useCallback(() => {
    // Map display selection back to natural selection
    const naturalSelection = {
      x: displaySelection.x / imageRect.scale,
      y: displaySelection.y / imageRect.scale,
      width: displaySelection.width / imageRect.scale,
      height: displaySelection.height / imageRect.scale,
    };

    // Crop the image
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = naturalSelection.width;
      canvas.height = naturalSelection.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          naturalSelection.x,
          naturalSelection.y,
          naturalSelection.width,
          naturalSelection.height,
          0,
          0,
          naturalSelection.width,
          naturalSelection.height
        );
        canvas.toBlob((blob) => {
          if (blob) {
            onConfirm(naturalSelection, blob);
          }
        }, 'image/png');
      }
    };
    img.src = imageUrl;
  }, [imageUrl, displaySelection, imageRect.scale, onConfirm]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirm, onCancel]);

  return (
    <div className={`fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/90 select-none ${fullScreen ? '' : 'p-4'}`}>
      <div className={`relative inline-flex overflow-hidden ${fullScreen ? 'w-full h-full' : 'max-w-full max-h-[80vh] rounded-md shadow-2xl'}`}>
        {/* Background image */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Screenshot"
          className="w-full h-full block object-contain"
          draggable={false}
          onLoad={updateMeasurements}
        />

        {/* Selection box */}
        {imageRect.width > 0 && (
          <SelectionBox
            selection={displaySelection}
            onSelectionChange={handleSelectionChange}
            minSize={minSize * imageRect.scale}
            maxWidth={imageRect.width}
            maxHeight={imageRect.height}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-50">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 bg-gray-700/80 hover:bg-gray-600 backdrop-blur-sm text-white rounded-full transition-colors text-sm font-medium shadow-lg"
        >
          取消 (Esc)
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-2.5 bg-[#1a73e8]/90 hover:bg-[#1557b0] backdrop-blur-sm text-white rounded-full transition-colors text-sm font-medium shadow-lg"
        >
          確認 (Enter)
        </button>
      </div>
    </div>
  );
}

export default ScreenshotOverlay;