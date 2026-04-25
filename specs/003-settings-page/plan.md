# Implementation Plan: 003-settings-page

**Branch**: `003-settings-page` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

設定頁面功能：提供模型設定（模型選擇 + API Key）和個人照片管理（上限 3 張）。模型設定存入 chrome.storage，照片存入 IndexedDB。

## Technical Context

**Language/Version**: TypeScript (strict mode)  
**Primary Dependencies**: React 18, Vite + vite-plugin-chrome-extension, Tailwind CSS, @iconify/react  
**Storage**: chrome.storage.local (模型設定), IndexedDB (照片 Blob)  
**Testing**: Vitest + @testing-library/react  
**Target Platform**: Chrome Extension Manifest V3  
**Project Type**: Chrome 擴充功能（popup + options page）  
**Performance Goals**: 設定頁面載入 < 2s，照片上傳錯誤提示 < 1s  
**Constraints**: Popup 需在 500ms 內載入，整體擴充功能 < 2MB  
**Scale/Scope**: 單一設定頁面，3 個照片卡槽

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. 元件優先架構 | ✅ PASS | UI 元件僅依賴 props，Chrome API 透過 hooks/services 包裝 |
| II. Manifest V3 合規 | ✅ PASS | 使用 service worker，權限聲明性宣告 |
| III. Vitest 測試優先 | ✅ PASS | 須先寫測試再實作 |
| IV. TypeScript 優先 | ✅ PASS | strict 模式，禁止 any |
| V. Icones 圖示庫 | ✅ PASS | 所有圖示使用 @iconify/react |

**Constitution Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/003-settings-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (if applicable)
```

### Source Code (repository root)

```text
src/
├── options/             # 設定選項頁面（主要實作區）
│   ├── index.html
│   ├── index.tsx
│   └── components/     # 設定頁面專用元件
├── components/         # 共用 React 元件
├── hooks/              # 自訂 hooks（含 Chrome API 包裝）
├── services/           # 商業邏輯（儲存服務）
├── types/              # 共用 TypeScript 類型
└── background/         # Service worker

tests/
├── components/
├── hooks/
└── integration/
```

**Structure Decision**: Chrome 擴充功能，設定頁面位於 `options/` 目錄。模型設定使用 `chrome.storage.local`，照片使用 IndexedDB 持續化。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
