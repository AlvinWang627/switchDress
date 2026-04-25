# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開發指令

```bash
npm run dev      # 啟動 Vite 開發伺服器，支援熱模組替換
npm run build    # 生產環境建置，輸出至 dist/
npm run preview  # 本地預覽建置結果
npm test         # 執行 Vitest 測試
npm run lint     # ESLint 程式碼檢查 + Prettier 格式驗證
npm run format   # 使用 Prettier 自動格式化程式碼
npm run typecheck # TypeScript 型別檢查
```

## 架構概覽

Chrome 擴充套件（Manifest V3）使用 React + TypeScript：

- **popup/** — 擴充套件彈出視窗 UI（`popup/index.html` → `popup/index.tsx`）。點擊擴充套件圖示時的主要進入點。
- **background/** — Service Worker（`background/index.ts`）。處理擴充套件生命週期與訊息傳遞。
- **options/** — 擴充套件設定選項頁面。
- **components/** — 共用 React 元件（App.tsx 是 popup 根元件）。
- **hooks/**, **services/**, **types/**, **content/** — 預留目錄，供未來功能擴充使用。

路徑別名：`@` 對應 `src/`（例如 `import X from '@/components/X'`）。

建置輸出：`dist/` 目錄，rollup 從 `src/manifest.json` 讀取設定。

## 技術棧

- TypeScript strict 模式、React 18、Vite、Tailwind CSS、@iconify/react
- 測試：Vitest + @testing-library/react + jsdom
- 程式碼品質：ESLint + Prettier
- Chrome 擴充套件整合：vite-plugin-chrome-extension

## 功能規格

功能規劃文件位於 `specs/<功能名稱>/`，包含 spec.md、plan.md、data-model.md 及 checklists/。

## spec-kit
所有的Markdown內容總是用中文撰寫