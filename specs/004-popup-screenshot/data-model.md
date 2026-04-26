# Data Model: Popup 截圖功能

**Feature**: 004-popup-screenshot
**Date**: 2026-04-26

## Entity: ScreenshotData

截圖資料實體，用於記憶體暫存。

```typescript
interface ScreenshotData {
  /** 截圖的 Blob 資料 */
  blob: Blob;
  /** 截圖時間戳記 (Unix ms) */
  timestamp: number;
  /** 選取區域座標與尺寸 */
  selection: SelectionRect;
}
```

**Lifecycle**: 與 popup 生命週期相同，關閉時自動刪除

---

## Entity: SelectionRect

選取框幾何狀態。

```typescript
interface SelectionRect {
  /** 左上角 X 座標 (像素) */
  x: number;
  /** 左上角 Y 座標 (像素) */
  y: number;
  /** 選取框寬度 (像素) */
  width: number;
  /** 選取框高度 (像素) */
  height: number;
}
```

**Validation**:
- `width >= 50` (最小寬度)
- `height >= 50` (最小高度)
- `x >= 0`, `y >= 0`
- `x + width <= viewportWidth`
- `y + height <= viewportHeight`

---

## Entity: SelectionState

選取過程中的互動狀態。

```typescript
type SelectionState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'selecting'; selection: SelectionRect; isDragging: boolean; resizeHandle: ResizeHandle | null }
  | { status: 'confirming' }
  | { status: 'error'; message: string };

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
```

**State Transitions**:
```
idle --> capturing (點擊相機圖示)
capturing --> selecting (截圖成功)
selecting --> idle (Escape 取消)
selecting --> confirming (Enter/確認按鈕)
confirming --> selecting (裁剪完成)
error --> selecting (使用者確認或取消)
```

---

## Entity: CaptureError

截圖失敗時的錯誤資訊。

```typescript
interface CaptureError {
  /** 錯誤類型 */
  type: 'PERMISSION_DENIED' | 'CAPTURE_FAILED' | 'UNKNOWN';
  /** 錯誤訊息 */
  message: string;
}
```

---

## Message Types (Background Communication)

現有 `src/types/message.ts` 需新增:

```typescript
// Popup --> Background
interface CaptureTabRequest {
  type: 'CAPTURE_TAB';
  tabId?: number; // optional, defaults to current tab
}

// Background --> Popup
interface CaptureTabResponse {
  type: 'CAPTURE_TAB_RESPONSE';
  success: boolean;
  data?: {
    dataUrl: string; // base64 PNG data URL
    width: number;
    height: number;
  };
  error?: {
    type: CaptureError['type'];
    message: string;
  };
}
```

---

## Component Props Types

### ScreenshotOverlayProps

```typescript
interface ScreenshotOverlayProps {
  /** 截圖的 data URL */
  imageUrl: string;
  /** 初始選取框 (預設為中央 50%) */
  initialSelection: SelectionRect;
  /** 選取完成回調 */
  onConfirm: (selection: SelectionRect, croppedBlob: Blob) => void;
  /** 取消選取回調 */
  onCancel: () => void;
  /** 最小選取尺寸 */
  minSize?: number; // default: 50
}
```

### ScreenshotPreviewProps

```typescript
interface ScreenshotPreviewProps {
  /** 截圖 Blob */
  blob: Blob;
  /** 刪除按鈕點擊回調 */
  onDelete: () => void;
}
```

---

## Type Exports

所有新增類型應匯出至 `src/types/screenshot.ts`:

```typescript
export type { ScreenshotData, SelectionRect, SelectionState, CaptureError };
export type { ScreenshotOverlayProps, ScreenshotPreviewProps };
export type { CaptureTabRequest, CaptureTabResponse };
```

---

## Relationships

```
Popup (index.tsx)
  ├── Header
  │   └── CameraIconButton --> 觸發截圖流程
  ├── ClothingAreaCard
  │   └── ScreenshotPreview (顯示截圖，帶刪除按鈕)
  └── ScreenshotOverlay (截圖選取介面，条件渲染)
                              │
                              ├── ImagePreview (完整截圖背景)
                              ├── SelectionBox (拖曳調整)
                              ├── SizeIndicator (即時尺寸提示)
                              └── ActionButtons (確認/取消)
```

---

## Storage

**In-Memory Only**: 根據規格，截圖僅存放於記憶體，不持久化。

```typescript
// Screenshot state in useScreenshot hook
const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    screenshots.forEach(s => URL.revokeObjectURL(URL.createObjectURL(s.blob)));
  };
}, [screenshots]);
```
