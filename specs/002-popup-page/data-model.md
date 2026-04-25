# Data Model: popup-page

**Branch**: `002-popup-page` | **Date**: 2026-04-25

## 實體定義

### 1. PopupWindow（彈出視窗）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | `string` | 固定值 `'popup'` |
| width | `number` | 寬度（預設 350px） |
| height | `string` | 高度（`'auto'` 或具体數值） |
| maxHeight | `string` | 最大高度（`'100vh'`） |

**職責**：管理 popup 視窗的可見性和尺寸配置。

---

### 2. CameraIcon（相機圖示）

| 欄位 | 類型 | 說明 |
|------|------|------|
| iconName | `'mdi:camera' \| 'bi:camera'` | Icones 圖示名稱 |
| size | `number` | 圖示大小（預設 64） |
| color | `string` | 顏色（預設 `#0d7ff2`） |
| ariaLabel | `string` | 無障礙標籤（預設 `'開啟相機'`） |

**職責**：顯示相機圖示作為視覺元素，點擊無動作。

---

### 3. ImageRecord（圖片記錄）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | `string` | UUID 作為唯一識別 |
| blob | `Blob` | 圖片二進位資料 |
| timestamp | `number` | 儲存時間戳 |
| thumbnail | `Blob?` | 縮圖（可選） |

**Object Store**: `images`
**Key Path**: `id`

**職責**：跨分頁拿取及儲存圖片。

---

### 4. Message（訊息）

| 欄位 | 類型 | 說明 |
|------|------|------|
| type | `'GET_IMAGES' \| 'SAVE_IMAGE' \| 'CAPTURE_SCREENSHOT'` | 訊息類型 |
| payload | `unknown` | 訊息內容 |
| tabId | `number?` | 分頁 ID（可選） |

**通訊協議**：
- Popup → Background：`chrome.runtime.sendMessage`
- Background → Content Script：`chrome.tabs.sendMessage`

---

## React 元件模型

```
popup/
├── index.tsx              # Popup 根元件（入口）
├── components/
│   └── CameraIcon/       # 相機圖示元件
│       ├── CameraIcon.tsx
│       └── CameraIcon.test.tsx
└── hooks/
    └── useImageStorage.ts # 圖片儲存 hook
```

### 元件props介面

```typescript
// CameraIcon 元件
interface CameraIconProps {
  size?: number;
  color?: string;
  className?: string;
}
```

---

## 狀態管理

| 狀態 | 來源 | 元件 |
|------|------|------|
| 深色模式 | CSS class / media query | App.tsx |
| 圖片列表 | IndexedDB via useImageStorage | App.tsx |
| UI 狀態 | React useState | 各元件 |

---

## 驗證規則

1. **FR-002**：相機圖示必須使用 `@iconify/react` 的 `Icon` 元件
2. **FR-005**：相機圖示點擊處理函式為空操作（no-op）
3. **FR-007**：圖片存取必須透過 `chrome.runtime.sendMessage` 與 background 雙向通訊

---

## 枚舉與常數

```typescript
// 訊息類型
const MESSAGE_TYPES = {
  GET_IMAGES: 'GET_IMAGES',
  SAVE_IMAGE: 'SAVE_IMAGE',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
} as const;

// IndexedDB 設定
const DB_CONFIG = {
  name: 'switch-dress-db',
  version: 1,
  storeName: 'images',
} as const;
```

---

## 依賴關係圖

```
App.tsx
├── CameraIcon/
│   └── props: size, color, className
└── useImageStorage (hook)
    └── imageService.ts
        └── IndexedDB (idb)
```
