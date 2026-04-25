# SwitchDress 章程

<!-- 同步影響報告:
  版本變更: N/A → 1.0.0 (初始建立)
  修改的原則: N/A (全部新增)
  新增區段: 技術棧、開發流程、Chrome 擴充功能約束
  移除區段: N/A
  模板需更新: ⚠ 待處理 (見下方)
  延後項目: RATIFICATION_DATE 設為首次提交日期
-->

## 核心原則

### I. 元件優先架構

每個 UI 元素都必須是獨立的、可獨立測試的 React 元件。元件必須有單一、明確的職責，且不得直接耦合 Chrome 擴充功能上下文 — 必須透過 hooks 或 services 包裝 Chrome API。元件在除了自身 props 之外，不應需要任何擴充功能特定程式碼即可使用。

理由：隔離能加快開發速度並提高測試可靠性；與 Chrome API 的緊密耦合會使元件難以測試和重用。

### II. Manifest V3 合規

所有擴充功能必須使用 Manifest V3 API。擴充功能必須使用 service workers 而非背景頁面。權限必須使用 `permissions` 和 `optional_permissions` 欄位聲明性聲明；必須避免在安裝時請求權限，僅在使用者觸發的動作時才有正當理由地請求。

理由：Manifest V3 是目前的 Chrome 擴充功能標準；聲明性權限可減少安裝時的阻力。

### III. Vitest 測試優先

所有新功能必須在實作前使用 Vitest 撰寫測試。紅-綠-重構循環是強制性的：先寫失敗的測試、實作最小通過程式碼、然後重構。測試檔案必須與原始碼放在一起（例如 `Component.tsx` → `Component.test.tsx`）。在單元測試中模擬 Chrome API；在整合測試中使用真實 API。

理由：Chrome 擴充功能在獨特的沙盒環境中執行，提前測試能及早發現整合問題。

### IV. TypeScript 優先

所有原始碼必須以啟用嚴格模式的 TypeScript 撰寫。除非絕對必要，否則不得使用 `any` 類型；若使用，必須在註解中說明理由。跨擴充功能共用的類型必須放在中央 `types/` 目錄；元件特定的類型可以與元件同層放置。

理由：TypeScript 在編譯時就能捕捉 Chrome API 的類型不符；Chrome 自身的型別定義可能略有出入，嚴格模式是必要的。

### V. Icones 圖示庫

擴充功能 UI 中使用的所有圖示必須 exclusively 使用 Icones 程式庫。Icon 元件使用必須一致 — 從 `@iconify/react` 匯入各別圖示以啟用 tree-shaking。除非 Icones 中沒有該圖示，否則禁止使用自訂 SVG 圖示。

理由：Icones 提供一致的樣式和所有圖示的統一 API；tree-shaking 保持擴充功能載入效能的套件大小輕巧。

## 技術棧

### 必要技術

- **框架**: React 18+
- **打包工具**: Vite (使用 `vite-plugin-chrome-extension` 處理 manifest)
- **測試**: Vitest + React Testing Library
- **圖示庫**: Icones (`@iconify/react`)
- **語言**: TypeScript (嚴格模式)
- **擴充功能 Manifest**: Version 3

### 專案結構

```text
src/
├── components/      # 可重用的 UI 元件 (React)
├── hooks/           # 自訂 hooks (包括 Chrome API 包裝)
├── services/        # 商業邏輯 (Chrome API 互動、儲存)
├── types/           # 共用 TypeScript 類型
├── content/         # Content scripts
├── background/      # Service worker 入口
└── popup/           # Popup UI 元件

tests/
├── components/      # 元件測試 (對應 src/components)
├── hooks/           # Hook 測試
└── integration/      # 端對端測試

public/
└── manifest.json    # 擴充功能 manifest
```

### 套件大小約束

- 擴充功能 popup 必須在普通硬體上於 500ms 內載入
- 背景 service worker 必須在 1s 內初始化
- 整體擴充功能大小應小於 2MB (不含 Chromium 快取)

## 開發流程

### Vite 開發流程

- 使用 `vite build` 生產建置，輸出至 `dist/`
- 使用 `vite dev` 開發，支援 popup 和選項頁面的 HMR
- Content scripts 在開發期間需透過擴充功能管理頁面手動重新載入

### 測試流程

1. 在原始碼旁邊的 `*.test.tsx` 中撰寫或更新測試
2. 執行 `vitest` 確認測試失敗 (預期行為)
3. 實作最小程式碼使測試通過
4. 執行 `vitest` 確認測試通過
5. 如需要則重構，重新執行測試確認無破壞

### Chrome API 處理

- Chrome API 必須包裝在 hooks 或 service 模組中
- 永遠不要在元件中直接呼叫 Chrome API — 使用包裝層
- 在單元測試中模擬所有 Chrome API (使用 `chrome` 全域或測試工具)
- 背景 service worker 必須處理 `onInstalled` 進行首次執行設定

### 擴充功能測試

- Popup UI：使用 `@testing-library/react` + `vitest` 測試
- Content scripts：透過測試環境注入測試
- 背景 service worker：使用 `chrome.storage` mock 的整合測試

## 治理

### 合規要求

- 所有 PR 必須確認 TypeScript 編譯通過且無錯誤
- 所有 PR 必須執行 `vitest` 並在新程式碼上達到 80% 以上的程式碼覆蓋率
- 禁止在 `src/hooks/` 或 `src/services/` 目錄外直接呼叫 Chrome API
- 除非有文件化的理由，否則不得使用 `any` 類型

### 章程優先順序

本章程優先於模板或技能檔案中任何衝突的實務。當模板原則與章程原則衝突時，以章程原則為準。

### 修訂程序

對本章程的修訂需要：
1. 一個修改 `.specify/memory/constitution.md` 的 PR
2. 清楚說明當前原則為何不足
3. 如果修訂影響現有程式碼，必須提供遷移計畫
4. 需獲得專案維護者的核准

**版本**: 1.0.0 | **通過日期**: TODO | **最後修訂**: 2026-04-25