import { describe, it, expect } from 'vitest';
import { validatePhoto } from '@/utils/validation';

const makeBlob = (type: string, size = 10) => new Blob([new Uint8Array(size)], { type });

describe('validatePhoto', () => {
  it.each(['image/jpeg', 'image/png'])('接受 %s', (type) => {
    expect(validatePhoto(makeBlob(type))).toEqual({ valid: true });
  });

  it.each(['image/gif', 'image/webp', 'application/pdf', ''])('拒絕不支援的格式 "%s"', (type) => {
    const result = validatePhoto(makeBlob(type));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('僅支援 JPEG 和 PNG 格式');
  });

  it('剛好 5MB 時通過', () => {
    expect(validatePhoto(makeBlob('image/png', 5 * 1024 * 1024)).valid).toBe(true);
  });

  it('超過 5MB 時拒絕', () => {
    const result = validatePhoto(makeBlob('image/png', 5 * 1024 * 1024 + 1));
    expect(result).toEqual({ valid: false, error: '圖片大小不可超過 5MB' });
  });

  it('格式檢查優先於大小檢查', () => {
    const result = validatePhoto(makeBlob('image/gif', 6 * 1024 * 1024));
    expect(result.error).toBe('僅支援 JPEG 和 PNG 格式');
  });
});
