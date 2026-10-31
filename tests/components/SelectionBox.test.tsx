import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import SelectionBox from '@/components/ScreenshotOverlay/SelectionBox';
import type { SelectionRect, ResizeHandle } from '@/types/screenshot';

const start: SelectionRect = { x: 100, y: 100, width: 200, height: 150 };
const MAX_W = 800;
const MAX_H = 600;

const CURSOR: Record<ResizeHandle, string> = {
  nw: 'nw-resize',
  n: 'n-resize',
  ne: 'ne-resize',
  e: 'e-resize',
  se: 'se-resize',
  s: 's-resize',
  sw: 'sw-resize',
  w: 'w-resize',
};

function setup(overrides: Partial<React.ComponentProps<typeof SelectionBox>> = {}) {
  const onSelectionChange = vi.fn();
  const utils = render(
    <SelectionBox
      selection={start}
      onSelectionChange={onSelectionChange}
      maxWidth={MAX_W}
      maxHeight={MAX_H}
      minSize={50}
      {...overrides}
    />
  );
  const box = utils.container.firstElementChild as HTMLElement;
  const handle = (h: ResizeHandle) =>
    utils.container.querySelector(`[style*="cursor: ${CURSOR[h]}"]`) as HTMLElement;
  return { ...utils, box, handle, onSelectionChange };
}

/** 在 (0,0) 按下，再把滑鼠移動 (dx, dy) */
function drag(target: HTMLElement, dx: number, dy: number) {
  fireEvent.mouseDown(target, { clientX: 0, clientY: 0 });
  fireEvent.mouseMove(window, { clientX: dx, clientY: dy });
}

describe('SelectionBox', () => {
  it('依 selection 定位與設定尺寸，並顯示尺寸指示器', () => {
    const { box, getByText } = setup();

    expect(box).toHaveStyle({ left: '100px', top: '100px', width: '200px', height: '150px' });
    expect(getByText('200 × 150')).toBeInTheDocument();
  });

  it('渲染 8 個縮放控制點', () => {
    const { handle } = setup();
    (Object.keys(CURSOR) as ResizeHandle[]).forEach((h) => expect(handle(h)).toBeTruthy());
  });

  describe('拖曳移動', () => {
    it('依滑鼠位移移動整個選取框，尺寸不變', () => {
      const { box, onSelectionChange } = setup();

      drag(box, 30, 20);

      expect(onSelectionChange).toHaveBeenLastCalledWith({ x: 130, y: 120, width: 200, height: 150 });
    });

    it('不會被拖出左上邊界', () => {
      const { box, onSelectionChange } = setup();

      drag(box, -500, -500);

      expect(onSelectionChange).toHaveBeenLastCalledWith({ x: 0, y: 0, width: 200, height: 150 });
    });

    it('不會被拖出右下邊界', () => {
      const { box, onSelectionChange } = setup();

      drag(box, 5000, 5000);

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        x: MAX_W - 200,
        y: MAX_H - 150,
        width: 200,
        height: 150,
      });
    });

    it('放開滑鼠後不再回報變更', () => {
      const { box, onSelectionChange } = setup();

      drag(box, 10, 10);
      onSelectionChange.mockClear();
      fireEvent.mouseUp(window);
      fireEvent.mouseMove(window, { clientX: 50, clientY: 50 });

      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('沒有按下滑鼠時移動不會有任何反應', () => {
      const { onSelectionChange } = setup();

      fireEvent.mouseMove(window, { clientX: 50, clientY: 50 });

      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('縮放', () => {
    it.each<[ResizeHandle, number, number, SelectionRect]>([
      ['se', 40, 30, { x: 100, y: 100, width: 240, height: 180 }],
      ['e', 40, 30, { x: 100, y: 100, width: 240, height: 150 }],
      ['s', 40, 30, { x: 100, y: 100, width: 200, height: 180 }],
      ['nw', 40, 30, { x: 140, y: 130, width: 160, height: 120 }],
      ['n', 40, 30, { x: 100, y: 130, width: 200, height: 120 }],
      ['ne', 40, 30, { x: 100, y: 130, width: 240, height: 120 }],
      ['sw', 40, 30, { x: 140, y: 100, width: 160, height: 180 }],
      ['w', 40, 30, { x: 140, y: 100, width: 160, height: 150 }],
    ])('%s 控制點 (dx=%i, dy=%i)', (h, dx, dy, expected) => {
      const { handle, onSelectionChange } = setup();

      drag(handle(h), dx, dy);

      expect(onSelectionChange).toHaveBeenLastCalledWith(expected);
    });

    it('縮放時不會觸發整體移動', () => {
      const { handle, onSelectionChange } = setup();

      drag(handle('e'), 40, 30);

      expect(onSelectionChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 100, y: 100 }));
    });

    it('寬高不得小於 minSize（se）', () => {
      const { handle, onSelectionChange } = setup({ minSize: 80 });

      drag(handle('se'), -500, -500);

      expect(onSelectionChange).toHaveBeenLastCalledWith({ x: 100, y: 100, width: 80, height: 80 });
    });

    it('從左上角縮到最小時，右下角位置保持不動', () => {
      const { handle, onSelectionChange } = setup({ minSize: 50 });

      drag(handle('nw'), 500, 500);

      // 右邊界 = 100 + 200 = 300、下邊界 = 100 + 150 = 250
      expect(onSelectionChange).toHaveBeenLastCalledWith({ x: 250, y: 200, width: 50, height: 50 });
    });

    it('不得超出右下邊界', () => {
      const { handle, onSelectionChange } = setup();

      drag(handle('se'), 5000, 5000);

      expect(onSelectionChange).toHaveBeenLastCalledWith({
        x: 100,
        y: 100,
        width: MAX_W - 100,
        height: MAX_H - 100,
      });
    });

    it('x / y 不會變成負值', () => {
      const { handle, onSelectionChange } = setup({ selection: { x: 10, y: 10, width: 200, height: 150 } });

      drag(handle('nw'), -100, -100);

      const result = onSelectionChange.mock.lastCall![0] as SelectionRect;
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });
});
