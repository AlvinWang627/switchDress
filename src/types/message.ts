export const MESSAGE_TYPES = {
  GET_IMAGES: 'GET_IMAGES',
  SAVE_IMAGE: 'SAVE_IMAGE',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
  CAPTURE_TAB: 'CAPTURE_TAB',
  START_OVERLAY: 'START_OVERLAY',
  AI_SYNTHESIZE: 'AI_SYNTHESIZE',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export interface ChromeMessage<T = unknown> {
  type: MessageType;
  payload: T;
  tabId?: number;
}

export interface GetImagesPayload {
  // No payload needed for get request
}

export interface SaveImagePayload {
  blob: Blob;
  thumbnail?: Blob;
}

export interface CaptureScreenshotPayload {
  tabId: number;
}
