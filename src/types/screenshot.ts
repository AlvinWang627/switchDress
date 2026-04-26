// Screenshot types for popup screenshot feature

export interface ScreenshotData {
  blob: Blob;
  timestamp: number;
  selection: SelectionRect;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type SelectionState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'selecting'; dataUrl: string; selection: SelectionRect; isDragging: boolean; resizeHandle: ResizeHandle | null }
  | { status: 'confirming' }
  | { status: 'error'; message: string };

export interface CaptureError {
  type: 'PERMISSION_DENIED' | 'CAPTURE_FAILED' | 'UNKNOWN';
  message: string;
}

export interface ScreenshotOverlayProps {
  imageUrl: string;
  initialSelection: SelectionRect;
  onConfirm: (selection: SelectionRect, croppedBlob: Blob) => void;
  onCancel: () => void;
  minSize?: number;
  fullScreen?: boolean;
}

export interface ScreenshotPreviewProps {
  blob: Blob;
  onDelete: () => void;
}