# Implementation Plan: Popup 截圖功能

**Branch**: `004-popup-screenshot` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-popup-screenshot/spec.md`

## Summary

實作 popup 截圖功能：使用者在 popup 點擊相機圖示後，系統透過 `chrome.tabs.captureVisibleTab` 截圖，並以覆蓋層方式讓使用者拖曳選取框選擇區域，確認後裁剪並暫存於記憶體。截圖僅存在於 popup 生命週期內，關閉後自動清除。

## Technical Context

**Language/Version**: TypeScript (strict mode)  
**Primary Dependencies**: React 18, Vite, Tailwind CSS, @iconify/react, vite-plugin-chrome-extension  
**Storage**: In-memory only (Blob), no persistence  
**Testing**: Vitest + @testing-library/react  
**Target Platform**: Chrome Extension (Manifest V3)  
**Project Type**: Chrome extension popup UI  
**Performance Goals**: 60fps drag selection, <1s screenshot display  
**Constraints**: Must use Chrome API wrappers per constitution; no direct Chrome API calls outside hooks/services  
**Scale/Scope**: Single popup page, 3 user stories, 12 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. 元件優先架構 | ✅ PASS | ScreenshotOverlay 元件獨立，可測試 |
| II. Manifest V3 合規 | ✅ PASS | 使用 service worker，activeTab 權限 |
| III. Vitest 測試優先 | ✅ PASS | 需先寫失敗測試再實作 |
| IV. TypeScript 優先 | ✅ PASS | 嚴格模式，新增 types/screenshot.ts |
| V. Icones 圖示庫 | ✅ PASS | 使用 @iconify/react |

**No violations detected.**

## Project Structure

### Documentation (this feature)

```text
specs/004-popup-screenshot/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - 純前端內部功能)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ScreenshotOverlay/           # NEW: 選取覆蓋層元件
│       ├── ScreenshotOverlay.tsx
│       ├── SelectionBox.tsx
│       ├── SizeIndicator.tsx
│       └── ScreenshotOverlay.test.tsx
├── hooks/
│   └── useScreenshot.ts              # NEW: 截圖狀態管理 hook
├── services/
│   └── captureService.ts             # NEW: chrome.tabs.captureVisibleTab 包裝
├── types/
│   └── screenshot.ts                 # NEW: 截圖相關類型定義
└── popup/
    └── index.tsx                     # MODIFIED: 整合截圖功能至現有 popup

src/types/message.ts                  # MODIFIED: 新增 CaptureTabRequest/Response
src/background/index.ts               # MODIFIED: 新增 CAPTURE_TAB handler
```

**Structure Decision**: 遵循現有專案結構，新增 `ScreenshotOverlay/` 元件資料夾、`useScreenshot.ts` hook、`captureService.ts` service 符合章程的目錄規範。

## Complexity Tracking

> No violations requiring justification.

## Implementation Phases

### Phase 1: 基礎設施

1. `src/types/screenshot.ts` - 新增截圖相關類型
2. `src/types/message.ts` - 新增 CaptureTab message types
3. `src/services/captureService.ts` - chrome.tabs.captureVisibleTab 包裝

### Phase 2: Hook 實作

4. `src/hooks/useScreenshot.ts` - 截圖狀態管理

### Phase 3: UI 元件

5. `src/components/ScreenshotOverlay/ScreenshotOverlay.tsx` - 覆蓋層主元件
6. `src/components/ScreenshotOverlay/SelectionBox.tsx` - 拖曳選取框
7. `src/components/ScreenshotOverlay/SizeIndicator.tsx` - 即時尺寸提示
8. `src/components/ScreenshotOverlay/ScreenshotOverlay.test.tsx` - 單元測試

### Phase 4: 整合

9. `src/popup/index.tsx` - 整合截圖功能至 popup
10. `src/background/index.ts` - 新增 CAPTURE_TAB handler

## Key Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/types/screenshot.ts` | CREATE | ScreenshotData, SelectionRect, SelectionState types |
| `src/types/message.ts` | MODIFY | 新增 CaptureTabRequest/Response |
| `src/services/captureService.ts` | CREATE | chrome.tabs.captureVisibleTab wrapper |
| `src/hooks/useScreenshot.ts` | CREATE | 截圖 state + cleanup |
| `src/components/ScreenshotOverlay/` | CREATE | 選取 UI 元件 |
| `src/popup/index.tsx` | MODIFY | 整合 CameraIcon 觸發 |
| `src/background/index.ts` | MODIFY | CAPTURE_TAB message handler |

## Reusable Patterns from Codebase

1. **Chrome API Wrapper** (`src/services/chromeStorage.ts`): captureService 遵循相同模式
2. **Hook Pattern** (`src/hooks/usePhotos.ts`): useScreenshot 遵循相同 CRUD + state 模式
3. **Component Structure** (`src/components/CameraIcon/`): ScreenshotOverlay 遵循相同獨立元件模式
4. **Icon Usage** (`@iconify/react`): 現有 mdi:camera-outline 等 icon 可直接使用

## Verification

1. `npm run typecheck` - TypeScript 編譯檢查
2. `npm test` - Vitest 單元測試
3. `npm run dev` - 手動測試截圖流程
4. 手動驗證：截圖 → 拖曳選取 → 調整大小 → 確認 → 刪除 → 關閉 popup 確認清除
