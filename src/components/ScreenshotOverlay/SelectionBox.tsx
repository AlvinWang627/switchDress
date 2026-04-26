// Selection box component with drag and resize handles

import { useCallback, useRef, useState, useEffect } from 'react';
import type { SelectionRect, ResizeHandle } from '@/types/screenshot';
import SizeIndicator from './SizeIndicator';

interface SelectionBoxProps {
  selection: SelectionRect;
  onSelectionChange: (selection: SelectionRect) => void;
  minSize?: number;
  maxWidth: number;
  maxHeight: number;
}

const HANDLE_SIZE = 10;

export function SelectionBox({
  selection,
  onSelectionChange,
  minSize = 50,
  maxWidth,
  maxHeight,
}: SelectionBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; selection: SelectionRect } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle?: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        selection: { ...selection },
      };
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
      } else {
        setIsDragging(true);
      }
    },
    [selection]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const startSel = dragStartRef.current.selection;

      if (isDragging) {
        // Dragging moves the entire selection
        let newX = startSel.x + dx;
        let newY = startSel.y + dy;

        // Constrain to viewport
        newX = Math.max(0, Math.min(newX, maxWidth - startSel.width));
        newY = Math.max(0, Math.min(newY, maxHeight - startSel.height));

        onSelectionChange({ ...startSel, x: newX, y: newY });
      } else if (isResizing && resizeHandle) {
        // Resizing adjusts specific edges
        let newX = startSel.x;
        let newY = startSel.y;
        let newWidth = startSel.width;
        let newHeight = startSel.height;

        switch (resizeHandle) {
          case 'nw':
            newX = startSel.x + dx;
            newY = startSel.y + dy;
            newWidth = startSel.width - dx;
            newHeight = startSel.height - dy;
            break;
          case 'n':
            newY = startSel.y + dy;
            newHeight = startSel.height - dy;
            break;
          case 'ne':
            newY = startSel.y + dy;
            newWidth = startSel.width + dx;
            newHeight = startSel.height - dy;
            break;
          case 'e':
            newWidth = startSel.width + dx;
            break;
          case 'se':
            newWidth = startSel.width + dx;
            newHeight = startSel.height + dy;
            break;
          case 's':
            newHeight = startSel.height + dy;
            break;
          case 'sw':
            newX = startSel.x + dx;
            newWidth = startSel.width - dx;
            newHeight = startSel.height + dy;
            break;
          case 'w':
            newX = startSel.x + dx;
            newWidth = startSel.width - dx;
            break;
        }

        // Apply minimum size
        if (newWidth < minSize) {
          if (resizeHandle.includes('w')) {
            newX = startSel.x + startSel.width - minSize;
          }
          newWidth = minSize;
        }
        if (newHeight < minSize) {
          if (resizeHandle.includes('n')) {
            newY = startSel.y + startSel.height - minSize;
          }
          newHeight = minSize;
        }

        // Constrain to viewport
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        if (newX + newWidth > maxWidth) newWidth = maxWidth - newX;
        if (newY + newHeight > maxHeight) newHeight = maxHeight - newY;

        onSelectionChange({ x: newX, y: newY, width: newWidth, height: newHeight });
      }
    },
    [isDragging, isResizing, resizeHandle, maxWidth, maxHeight, minSize, onSelectionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    dragStartRef.current = null;
  }, []);

  // Attach window-level event listeners for drag operations
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove as EventListener);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as EventListener);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute cursor-move"
      style={{
        left: selection.x,
        top: selection.y,
        width: selection.width,
        height: selection.height,
      }}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />

      {/* Size indicator */}
      <SizeIndicator width={selection.width} height={selection.height} />

      {/* Corner handles */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nw-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'ne-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'ne')}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'sw-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'sw')}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'se-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />

      {/* Edge handles */}
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ top: -HANDLE_SIZE / 2, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ bottom: -HANDLE_SIZE / 2, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 's')}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ left: -HANDLE_SIZE / 2, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
        style={{ right: -HANDLE_SIZE / 2, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'e')}
      />
    </div>
  );
}

export default SelectionBox;