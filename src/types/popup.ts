export interface PopupWindow {
  id: 'popup';
  width: number;
  height: string;
  maxHeight: string;
}

export interface CameraIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export interface ImageRecord {
  id: string;
  blob: Blob;
  timestamp: number;
  thumbnail?: Blob;
  isFavorite?: boolean;
}

export const POPUP_CONFIG: PopupWindow = {
  id: 'popup',
  width: 350,
  height: 'auto',
  maxHeight: '100vh',
};
