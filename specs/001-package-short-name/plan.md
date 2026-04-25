# Implementation Plan: Base Infrastructure Setup

**Branch**: `001-base-infrastructure` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-package-short-name/spec.md`

## Summary

建立 Chrome 擴充功能開發基礎設施，包含 React + TypeScript + Vite + Tailwind CSS + Vitest + ESLint/Prettier + Icônes 技術棧。目標是讓新進開發者能透過單一 `npm install` 指令完成環境設定，並具備熱重載開發和自動化測試能力。

## Technical Context

**Language/Version**: TypeScript (strict mode)  
**Primary Dependencies**: React 18+, Vite, vite-plugin-chrome-extension, Tailwind CSS, @iconify/react, Vitest, ESLint, Prettier  
**Storage**: N/A (Chrome Extension storage API for runtime data)  
**Testing**: Vitest + React Testing Library  
**Target Platform**: Chrome Browser (Manifest V3)  
**Project Type**: Chrome Extension (web-browser-extension)  
**Performance Goals**: 建置 < 60s, 熱重載 < 5s  
**Constraints**: Popup 載入 < 500ms, 總大小 < 2MB  
**Scale/Scope**: 單一擴充功能，多元件架構

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 元件優先架構 | ✅ | 章程定義的 src/components/, hooks/, services/ 結構 |
| II. Manifest V3 合規 | ✅ | manifest_version: 3, service worker |
| III. Vitest 測試優先 | ✅ | Vitest + React Testing Library |
| IV. TypeScript 優先 | ✅ | 嚴格模式，無 any |
| V. Icones 圖示庫 | ✅ | @iconify/react |

所有章程原則已符合，無需調適（violations）。

## Project Structure

### Documentation (this feature)

```text
specs/001-package-short-name/
├── plan.md              # 本檔案
├── research.md          # Phase 0 輸出
├── data-model.md        # Phase 1 輸出
├── quickstart.md        # Phase 1 輸出
└── tasks.md             # Phase 2 輸出（/speckit.tasks 建立）
```

### Source Code (repository root)

```text
switchDress/
├── src/
│   ├── components/      # 可重用的 UI 元件 (React)
│   ├── hooks/           # 自訂 hooks (包括 Chrome API 包裝)
│   ├── services/        # 商業邏輯 (Chrome API 互動、儲存)
│   ├── types/           # 共用 TypeScript 類型
│   ├── content/         # Content scripts
│   ├── background/      # Service worker 入口
│   └── popup/           # Popup UI 元件
├── public/
│   └── manifest.json    # 擴充功能 manifest
├── tests/
│   ├── components/      # 元件測試
│   ├── hooks/           # Hook 測試
│   └── integration/     # 端對端測試
├── dist/                # 建置輸出（gitignore）
├── vite.config.ts       # Vite 設定
├── tsconfig.json        # TypeScript 設定
├── vitest.config.ts     # Vitest 設定
├── tailwind.config.js   # Tailwind CSS 設定
├── postcss.config.js    # PostCSS 設定
├── .eslintrc.js         # ESLint 設定
├── .prettierrc          # Prettier 設定
└── package.json
```

**Structure Decision**: 採用章程定義的標準結構，包含 React 元件、hooks、services 分層。Vite + vite-plugin-chrome-extension 處理 manifest 和熱重載。

## Complexity Tracking

> 本基礎設施無 Complexity Violations

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 無 | - | - |

## Phase 1 Artifacts

- [x] `research.md` - 技術決策研究
- [x] `data-model.md` - Manifest V3 類型定義
- [x] `quickstart.md` - 開發環境快速開始指南

## 下一步

執行 `/speckit-tasks` 以產生具體任務清單並開始實作。
