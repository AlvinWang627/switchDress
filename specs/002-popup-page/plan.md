# Implementation Plan: popup-page

**Branch**: `002-popup-page` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from Stitch project "switchDress Home with Camera Icon"

## Summary

建立 SwitchDress Chrome 擴充功能 popup 頁面，顯示帶有相機圖示的主介面。Popup 作為擴充功能的主要入口點，需要支援深色模式、在 500ms 內載入、並與 background script 雙向通訊以跨分頁拿取及儲存圖片。

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Primary Dependencies**: React 18, Vite, vite-plugin-chrome-extension, @iconify/react, Tailwind CSS
**Storage**: IndexedDB（圖片儲存）
**Testing**: Vitest + React Testing Library + jsdom
**Target Platform**: Chrome Extension (Manifest V3)
**Project Type**: Browser extension / Chrome extension
**Performance Goals**: Popup 500ms 內載入，背景 service worker 1s 內初始化
**Constraints**: 遵守 Manifest V3、Chrome popup 尺寸限制（約 350px 寬度）
**Scale/Scope**: 單一 popup 頁面，含相機圖示 UI 元素

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 章程原則 | 狀態 | 備註 |
|---------|------|------|
| I. 元件優先架構 | ✅ | UI 元件為獨立 React 元件，透過 hooks 包裝 Chrome API |
| II. Manifest V3 合規 | ✅ | 使用 service workers，符合聲明性權限要求 |
| III. Vitest 測試優先 | ⚠️ 待落實 | 需要先建立元件測試再實作 |
| IV. TypeScript 優先 | ✅ | 嚴格模式 TypeScript |
| V. Icones 圖示庫 | ✅ | 相機圖示使用 @iconify/react |

**GATE 評估**：原則 I、II、IV、V 已滿足。原則 III（測試優先）需要實作前建立測試。建議 Phase 1 同步建立元件測試。

## Project Structure

### Documentation (this feature)

```text
specs/002-popup-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (若需要)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── popup/               # Popup UI 元件
│   ├── index.tsx        # Popup 根元件
│   └── components/      # Popup 專用元件
│       └── CameraIcon/  # 相機圖示元件
├── components/          # 共用 UI 元件
├── hooks/               # 自訂 hooks (Chrome API 包裝)
│   └── useChromeStorage.ts
├── services/            # 商業邏輯
│   └── imageService.ts  # 圖片擷取與儲存服務
├── background/          # Service worker
│   └── index.ts
└── types/               # 共用類型定義

tests/
├── components/          # 元件測試
└── integration/         # 整合測試
```

**Structure Decision**: 標準 Chrome 擴充功能結構，popup 目錄作為 UI 入口點，共用元件置於 components/。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research

### Unknowns to Resolve

| Unknown | 狀態 | 結論 |
|---------|------|------|
| Chrome Extension Popup 尺寸限制 | ✅ 已解決 | 寬度約 350px 可自訂，高度由內容決定 |
| Icones 圖示選擇 | ✅ 已解決 | 使用 `mdi:camera` 或 `bi:camera` |
| IndexedDB 圖片儲存策略 | ✅ 已解決 | 使用 `idb` 庫，Object Store: `images` |
| 深色模式實作方式 | ✅ 已解決 | Tailwind `darkMode: 'class'` 或 `'media'` |

**Output**: `research.md` 已產生

## Phase 1: Design

### Artifacts to Generate

- [x] `research.md` - 研究結果文件
- [x] `data-model.md` - 實體模型定義
- [ ] `quickstart.md` - 快速開始指南（若需要）
- [ ] `/contracts/` - 介面合約（若需要）
