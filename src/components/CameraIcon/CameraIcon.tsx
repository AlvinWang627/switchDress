import { Icon } from '@iconify/react';
import type { CameraIconProps } from './types';

const DEFAULT_SIZE = 64;
const DEFAULT_COLOR = '#0d7ff2';
const DEFAULT_ARIA_LABEL = '開啟相機';

export function CameraIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR, className = '' }: CameraIconProps) {
  const handleClick = () => {
    // No-op: camera icon is visual decoration only
  };

  return (
    <span
      role="img"
      aria-label={DEFAULT_ARIA_LABEL}
      className={`inline-flex items-center justify-center cursor-default ${className}`}
      onClick={handleClick}
    >
      <Icon
        icon="mdi:camera"
        style={{ width: size, height: size, color }}
      />
    </span>
  );
}

export default CameraIcon;
