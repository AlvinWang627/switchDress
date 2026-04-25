const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePhoto(blob: Blob): ValidationResult {
  if (!ALLOWED_TYPES.includes(blob.type)) {
    return { valid: false, error: '僅支援 JPEG 和 PNG 格式' };
  }
  if (blob.size > MAX_SIZE) {
    return { valid: false, error: '圖片大小不可超過 5MB' };
  }
  return { valid: true };
}
