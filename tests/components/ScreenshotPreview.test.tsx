import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScreenshotPreview from '@/components/ScreenshotPreview';

describe('ScreenshotPreview', () => {
  const blob = new Blob(['img'], { type: 'image/png' });

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
  });

  it('以 blob 建立物件網址顯示圖片，且只建立一次', () => {
    const { rerender } = render(<ScreenshotPreview blob={blob} onDelete={() => {}} />);

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(screen.getByAltText('Screenshot')).toHaveAttribute('src', 'blob:preview');

    rerender(<ScreenshotPreview blob={blob} onDelete={() => {}} />);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('點擊刪除按鈕呼叫 onDelete', () => {
    const onDelete = vi.fn();
    render(<ScreenshotPreview blob={blob} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('刪除截圖'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('刪除按鈕預設隱藏，滑鼠移入顯示、移出再隱藏', () => {
    const { container } = render(<ScreenshotPreview blob={blob} onDelete={() => {}} />);
    const button = screen.getByLabelText('刪除截圖');
    const wrapper = container.firstElementChild as HTMLElement;

    expect(button).toHaveClass('opacity-0');
    fireEvent.mouseEnter(wrapper);
    expect(button).toHaveClass('opacity-100');
    fireEvent.mouseLeave(wrapper);
    expect(button).toHaveClass('opacity-0');
  });
});
