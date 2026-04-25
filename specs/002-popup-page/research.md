# Research: popup-page

**Branch**: `002-popup-page` | **Date**: 2026-04-25

## 研究問題 1: Chrome Extension Popup 尺寸限制

### Decision
Chrome Extension Popup 寬度預設約 350px，高度由內容決定但有最大值。高度可通過 CSS `max-height` 控制，但無法超過瀏覽器設定的硬性上限。

### Rationale
Chrome 對 popup 視窗的尺寸有以下限制：
- 寬度：預設約 350px，可通過 `default_width`/`max_width` 在 manifest 中設定
- 高度：無絕對限制，但內容過長會出現內部滾動
- 最小尺寸：`min_width`/`min_height` 可設定

### Alternatives Considered
1. **固定高度**：不建議，會截斷內容
2. **僅設定 min_width**：允許使用者調整，彈性更好

---

## 研究問題 2: Icones 相機圖示選擇

### Decision
使用 `@iconify/react` 的 `mdi:camera` 或 `bi:camera` 圖示。專案已安裝 `@iconify/react@^4.1.1`，可直接使用。

### Rationale
```tsx
import { Icon } from '@iconify/react';
// 使用 camera 圖示
<Icon icon="mdi:camera" />
// 或 bi:camera (Bootstrap Icons)
<Icon icon="bi:camera" />
```

### Alternatives Considered
1. **自訂 SVG**：不符章程 V（Icones 優先）
2. **其他 Icones 圖示**：如 `ph:camera` (Phosphor)、`lucide:camera`：可選但 `mdi:camera` 最廣泛使用

---

## 研究問題 3: IndexedDB 圖片儲存策略

### Decision
使用 `idb` 庫（基於 IndexedDB 的 Promise 包裝）管理圖片儲存。結構：
- Database: `switch-dress-db`
- Object Store: `images`（keyPath: `id`）
- 圖片以 Blob 形式儲存

### Rationale
```typescript
import { openDB, DBSchema } from 'idb';

interface ImageRecord {
  id: string;
  blob: Blob;
  timestamp: number;
}

const db = await openDB('switch-dress-db', 1, {
  upgrade(db) {
    db.createObjectStore('images', { keyPath: 'id' });
  },
});
```

### Alternatives Considered
1. **chrome.storage.local**：有 10MB 限制，不適合大量圖片
2. **localStorage**：僅支援字串，不適合二進位資料
3. **直接使用 IndexedDB API**：麻瑣，`idb` 提供 Promise 化包裝更簡潔

---

## 研究問題 4: Tailwind CSS 深色模式實作

### Decision
使用 Tailwind CSS `darkMode: 'class'` 或 `'media'` 策略，配合 CSS 變數定義深色主題色彩。

### Rationale
```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // 或 'media' 跟隨系統
  theme: {
    extend: {
      colors: {
        primary: '#0d7ff2',
      },
    },
  },
}
```

Popup 可透過：
1. CSS 變數：`var(--color-primary)`
2. 直接 Tailwind 類別：`bg-primary dark:bg-primary`

### Alternatives Considered
1. **CSS 變數 + class**：最靈活
2. **dark mode media query**：跟隨系統設定
3. **CSS class 手動切換**：需要狀態管理

---

## 技術棧確認

| 項目 | 選擇 | 理由 |
|------|------|------|
| Popup 尺寸 | manifest 設定 + CSS max-height | 符合 Manifest V3 |
| 圖示庫 | @iconify/react (已安裝) | 章程 V 要求 |
| 圖片儲存 | idb + IndexedDB | 適合大型二進位資料 |
| 深色模式 | Tailwind darkMode | 現有 Tailwind 基礎 |
| 類型定義 | types/ 目錄 | 章程 IV 要求 |

---

## 待解決假設（已驗證/不需進一步釐清）

| 假設 | 狀態 | 備註 |
|------|------|------|
| Chrome popup 寬度約 350px | ✅ 已確認 | manifest 可自訂 |
| 相機圖示為視覺裝飾 | ✅ 已確認 | 點擊無動作 |
| IndexedDB 適用於圖片儲存 | ✅ 已確認 | 比 chrome.storage 更適合 |
| 深色模式使用 #0d7ff2 | ✅ 已確認 | spec 中定義 |
