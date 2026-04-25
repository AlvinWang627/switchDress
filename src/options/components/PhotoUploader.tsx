import { useRef } from 'react';
import { Icon } from '@iconify/react';

interface PhotoUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

export function PhotoUploader({
  onFileSelect,
  disabled,
  accept = 'image/jpeg,image/png',
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label="上傳照片"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <Icon icon="mdi:upload" className="w-5 h-5" />
        上傳照片
      </button>
    </div>
  );
}
