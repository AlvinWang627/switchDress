# Implementation Plan: Popup Photo Gallery + AI Synthesis

**Branch**: `005-popup-photo-gallery` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)

## Summary

實作 Popup 頁面個人照片展示、AI 服裝合成功能、以及相片集全頁面（瀑布流 Masonry 佈局）。AI 使用 Google Gemini API，瀑布流使用 `react-responsive-masonry`。

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, @iconify/react, idb, `react-responsive-masonry`  
**Storage**: IndexedDB (`imageService`), chrome.storage.local (settings)  
**Testing**: Vitest + @testing-library/react  
**Target Platform**: Chrome Extension Manifest V3  
**Performance Goals**: Popup 載入 <500ms, AI 合成完成後通知 <2s  
**Constraints**: Service Worker 不可長期運行，需確保非同步作業在 worker 終止前完成

## Constitution Check

- [x] **元件優先架構**: 所有 UI 元件獨立、可測試，Chrome API 透過 hooks/services 包裝
- [x] **Manifest V3 合規**: Service Worker、聲明性權限
- [x] **Vitest 測試優先**: 實作前先寫測試（紅-綠-重構）
- [x] **TypeScript 優先**: 嚴格模式，無 `any`
- [x] **Icones 圖示庫**: 全部使用 @iconify/react

## Project Structure

```
src/
├── components/
│   ├── MasonryGallery.tsx       # 新增：瀑布流容器 (react-responsive-masonry)
│   └── GalleryItem.tsx          # 新增：相片集項目（刪除/最愛按鈕）
├── hooks/
│   ├── useAISynthesis.ts        # 新增：AI 合成 hook
│   └── useNotification.ts      # 新增：Chrome 通知 hook
├── services/
│   ├── geminiService.ts        # 新增：Gemini API 呼叫
│   └── notificationService.ts  # 新增：Chrome Notification 包裝
├── types/
│   ├── gallery.ts              # 新增：相片集類型 (GeneratedPhoto)
│   └── message.ts              # 修改：新增 AI_SYNTHESIZE, TOGGLE_FAVORITE
├── gallery/                    # 新增：相片集全頁面
│   ├── index.html
│   ├── index.tsx
│   └── index.css
├── popup/
│   └── index.tsx               # 修改：連接 AI 合成
└── background/
    └── index.ts                # 修改：新增 AI_SYNTHESIZE 訊息處理

specs/005-popup-photo-gallery/
├── plan.md               # 本檔案
├── research.md           # Phase 0 產出
├── data-model.md         # Phase 1 產出
└── quickstart.md         # Phase 1 產出
```

## Implementation Phases

### Phase 0: Research (research.md)

**Research Topics**:
- `react-responsive-masonry` 與 React 18 + TypeScript + Vite 整合方式
- Chrome Extension Service Worker 中呼叫 Gemini API 的模式（含 Blob 傳遞限制）
- Chrome Notification API 在 MV3 中的使用方式
- 現有 useScreenshot hook 的 Blob 處理模式

**Output**: `research.md`

---

### Phase 1: 類型擴展 + 現有服務增強

**修改檔案**:
- `src/types/popup.ts` — ImageRecord 新增 `isFavorite` 欄位
- `src/services/imageService.ts` — 新增 `updateImage`, `getAllImagesSorted` 方法
- `src/types/message.ts` — 新增訊息類型 `AI_SYNTHESIZE`, `TOGGLE_FAVORITE`, `SHOW_NOTIFICATION`

**Key Entities**:
- `GeneratedPhoto`: ImageRecord + 原衣服/個人照片 ID、最愛標記

**Output**: `data-model.md`

---

### Phase 2: AI 合成服務 + Notification

**新增檔案**:
- `src/services/geminiService.ts`
  - `synthesizeImage(personBlob, clothingBlob, apiKey, model): Promise<Blob>`
  - Blob → base64 → API call
  - Prompt: "Virtual try-on: Put the clothing from image A onto the person in image B..."
- `src/services/notificationService.ts`
  - `showSynthesisComplete(resultImageBlob): void`
  - `showError(message: string): void`
- `src/hooks/useAISynthesis.ts`
  - 狀態：idle | capturing | synthesizing | success | error
  - 背景 worker 執行，完成後發送 Chrome Notification
- `src/hooks/useNotification.ts`

**修改檔案**:
- `src/background/index.ts` — 新增 `AI_SYNTHESIZE` 訊息處理
- `src/popup/index.tsx` — AIActionButton 連接 AI 合成邏輯

**API Endpoint**:
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

**Important Pattern**: Service Worker 中 Blob 無法直接傳遞，需先轉為 base64。

---

### Phase 3: 相片集頁面

**新增檔案**:
- `src/gallery/index.html` — 相片集 HTML 入口
- `src/gallery/index.tsx` — 相片集根元件
- `src/gallery/index.css` — 相片集樣式
- `src/components/MasonryGallery.tsx` — 瀑布流容器
- `src/components/GalleryItem.tsx` — 個別圖片項目

**使用 `react-responsive-masonry`**:
```tsx
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

<ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2 }}>
  <Masonry gutter="12px">
    {images.map(img => <GalleryItem key={img.id} image={img} />)}
  </Masonry>
</ResponsiveMasonry>
```

**修改檔案**:
- `src/manifest.json` — 新增 gallery 頁面設定
- `src/popup/index.tsx` — Header Album 按鈕開啟相片集頁面

---

### Phase 4: 測試

**新增測試**:
- `src/services/geminiService.test.ts`
- `src/services/notificationService.test.ts`
- `src/hooks/useAISynthesis.test.ts`
- `src/components/MasonryGallery.test.tsx`
- `src/components/GalleryItem.test.tsx`

**修改現有測試**:
- `src/services/imageService.test.ts` — 新增 isFavorite 相關測試

---

## Key Design Decisions

| 決策 | 選擇 | 理由 |
|------|------|------|
| 瀑布流函式庫 | `react-responsive-masonry` | 使用者指定 |
| AI API | Google Gemini API | 使用者指定 |
| 最愛儲存 | ImageRecord.isFavorite | 與圖片一同儲存 |
| 背景任務通知 | Chrome Notification API | 章程規範 |
| AI Prompt | "Virtual try-on: Put the clothing from image A onto the person in image B..." | 規格 FR-006 |
| Blob 傳遞 | base64 編碼 | Service Worker 限制 |

## Verification

1. `npm run typecheck` — TypeScript 編譯無誤
2. `npm run lint` — ESLint 檢查通過
3. `npm test` — 所有 Vitest 測試通過（80%+ 覆蓋率）
4. 手動測試：
   - 開啟 Popup，確認個人照片正確顯示
   - 選擇衣服截圖 + 個人照片，按下 AI 合成
   - 關閉 Popup，確認背景執行，完成後收到通知
   - 進入相片集，確認瀑布流顯示
   - 測試刪除、最愛功能
