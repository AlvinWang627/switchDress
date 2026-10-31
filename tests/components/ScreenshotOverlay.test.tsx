import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ScreenshotOverlay from '@/components/ScreenshotOverlay/ScreenshotOverlay';

/** 載入後立刻觸發 onload 的假 Image（handleConfirm 內的 new Image()） */
class FakeImage {
  onload: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}

const initialSelection = { x: 100, y: 100, width: 400, height: 200 };

/** 讓 <img> 看起來是以 0.5 倍縮放顯示：自然寬 1000、顯示寬 500 */
function mockImageMeasurements({ client = 500, natural = 1000, clientHeight = 300 } = {}) {
  vi.spyOn(HTMLImageElement.prototype, 'clientWidth', 'get').mockReturnValue(client);
  vi.spyOn(HTMLImageElement.prototype, 'clientHeight', 'get').mockReturnValue(clientHeight);
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(natural);
}

function renderOverlay(props: Partial<React.ComponentProps<typeof ScreenshotOverlay>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ScreenshotOverlay
      imageUrl="data:image/png;base64,AAA"
      initialSelection={initialSelection}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  const img = screen.getByAltText('Screenshot');
  const loadImage = () => fireEvent.load(img);
  return { ...utils, onConfirm, onCancel, img, loadImage };
}

describe('ScreenshotOverlay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('尚未載入圖片', () => {
    it('不顯示選取框，但有取消與確認按鈕', () => {
      renderOverlay();

      expect(screen.queryByText(/×/)).not.toBeInTheDocument();
      expect(screen.getByText('取消 (Esc)')).toBeInTheDocument();
      expect(screen.getByText('確認 (Enter)')).toBeInTheDocument();
    });

    it('naturalWidth 為 0 時（圖片尚未解碼）不顯示選取框', () => {
      mockImageMeasurements({ natural: 0 });
      const { loadImage } = renderOverlay();

      loadImage();

      expect(screen.queryByText(/×/)).not.toBeInTheDocument();
    });
  });

  describe('圖片載入後', () => {
    beforeEach(() => mockImageMeasurements());

    it('依縮放比例換算初始選取範圍', () => {
      const { loadImage } = renderOverlay();

      loadImage();

      // scale = 500 / 1000 = 0.5 → 400x200 顯示為 200x100
      expect(screen.getByText('200 × 100')).toBeInTheDocument();
    });

    it('視窗縮放時重新量測', () => {
      const { loadImage } = renderOverlay();
      loadImage();
      vi.spyOn(HTMLImageElement.prototype, 'clientWidth', 'get').mockReturnValue(250);

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // scale = 0.25 → 100x50
      expect(screen.getByText('100 × 50')).toBeInTheDocument();
    });
  });

  describe('取消', () => {
    it('點擊取消按鈕呼叫 onCancel', () => {
      const { onCancel } = renderOverlay();
      fireEvent.click(screen.getByText('取消 (Esc)'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('按 Esc 呼叫 onCancel', () => {
      const { onCancel } = renderOverlay();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('其他按鍵不會觸發任何動作', () => {
      const { onCancel, onConfirm } = renderOverlay();
      fireEvent.keyDown(window, { key: 'a' });
      expect(onCancel).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('卸載後不再監聽鍵盤', () => {
      const { onCancel, unmount } = renderOverlay();
      unmount();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('確認', () => {
    let drawImage: ReturnType<typeof vi.fn>;
    let toBlob: ReturnType<typeof vi.fn>;
    const cropped = new Blob(['cropped'], { type: 'image/png' });

    beforeEach(() => {
      mockImageMeasurements();
      vi.stubGlobal('Image', FakeImage);
      drawImage = vi.fn();
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
      toBlob = vi.fn((cb: (b: Blob | null) => void) => cb(cropped));
      HTMLCanvasElement.prototype.toBlob = toBlob as unknown as HTMLCanvasElement['toBlob'];
    });

    const flush = () => act(async () => {});

    it('點擊確認：以自然尺寸裁切並回傳選取範圍與 Blob', async () => {
      const { loadImage, onConfirm } = renderOverlay();
      loadImage();

      fireEvent.click(screen.getByText('確認 (Enter)'));
      await flush();

      // 顯示座標除以 scale 後回到自然座標
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 100, 100, 400, 200, 0, 0, 400, 200);
      expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
      expect(onConfirm).toHaveBeenCalledWith({ x: 100, y: 100, width: 400, height: 200 }, cropped);
    });

    it('按 Enter 等同點擊確認', async () => {
      const { loadImage, onConfirm } = renderOverlay();
      loadImage();

      fireEvent.keyDown(window, { key: 'Enter' });
      await flush();

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('取不到 canvas context 時不呼叫 onConfirm', async () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
      const { loadImage, onConfirm } = renderOverlay();
      loadImage();

      fireEvent.click(screen.getByText('確認 (Enter)'));
      await flush();

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('toBlob 產生 null 時不呼叫 onConfirm', async () => {
      toBlob.mockImplementation((cb: (b: Blob | null) => void) => cb(null));
      const { loadImage, onConfirm } = renderOverlay();
      loadImage();

      fireEvent.click(screen.getByText('確認 (Enter)'));
      await flush();

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('版面', () => {
    it('fullScreen 時外層沒有 padding', () => {
      const { container } = renderOverlay({ fullScreen: true });
      expect(container.firstElementChild).not.toHaveClass('p-4');
    });

    it('非 fullScreen 時外層有 padding', () => {
      const { container } = renderOverlay({ fullScreen: false });
      expect(container.firstElementChild).toHaveClass('p-4');
    });
  });
});
