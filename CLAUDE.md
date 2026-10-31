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

執行單一測試：`npx vitest run tests/hooks/useScreenshot.test.ts`（加 `-t "名稱"` 可依測試名稱過濾）；`npm run test:coverage` 產生覆蓋率。

### 測試慣例

- 測試位於 `tests/`（依 `src/` 結構分資料夾），`src/**/*.test.tsx` 也會被收集。
- `tests/setup.ts` 全域處理：`fake-indexeddb`（IndexedDB 服務用真實實作測試）、`@iconify/react` mock（圖示渲染為帶 `data-icon` 的 `span`）。
- Chrome API 用 `tests/helpers/chrome.ts` 的 `installChromeMock()`（記憶體版 `storage.local`，並暴露已註冊的 `onMessage` listeners）；測試結束要 `uninstallChromeMock()`。若被測 hook 卸載時會用到 `chrome`，須先 `cleanup()` 再移除 mock。
- `chromeStorage.ts`、`imageService.ts`、`photoService.ts` 帶有模組層級快取，測試需 `vi.resetModules()` 後再動態 `import`（IndexedDB 另以 `new IDBFactory()` 重置）。
- `vi.mock` 工廠內若要引用外部變數，必須用 `vi.hoisted()`。mock 的 hook 回傳值要是穩定參照（例如 `SettingsSection` 以 `[settings]` 為 effect 相依，每次回傳新物件會造成無限重新渲染）。

## 架構概覽

Chrome 擴充套件（Manifest V3）使用 React + TypeScript，`src/` 下有四個執行環境，彼此只能透過 Chrome 訊息或 storage 溝通：

- **popup/** — 彈出視窗 UI（`popup/index.tsx`，根元件 `components/App.tsx`）。
- **background/** — Service Worker（`background/index.ts`）。單一 `onMessage` listener 依 `MESSAGE_TYPES` 分派；負責 `chrome.tabs.captureVisibleTab`（`CAPTURE_TAB`）與 IndexedDB 圖片存取（`GET_IMAGES` / `SAVE_IMAGE`）。
- **content/** — Content script（`content/index.tsx`），注入所有頁面。收到 `START_OVERLAY` 後向 background 要整頁截圖，再把 `ScreenshotOverlay` 掛到 Shadow DOM（樣式用 `?inline` 匯入 `style/index.css`，避免與宿主頁面互相污染）。
- **options/** — 設定頁（API Key、模型選擇、個人照片上傳），由 popup 的設定按鈕開啟。

### 截圖流程（跨環境，需讀多個檔案才能理解）

popup（`hooks/useScreenshot.ts`）→ `chrome.tabs.sendMessage(START_OVERLAY)` 給 content script → content 送 `CAPTURE_TAB` 給 background 取得 dataUrl → 使用者在 overlay 框選 → content 將結果以 base64 存入 `chrome.storage.local.draftScreenshot`（popup 此時已關閉）→ 使用者再次開啟 popup 時，`useScreenshot` 在 mount 時讀取 `draftScreenshot` 還原成 Blob 預覽。`isCapturing` 為流程旗標。若 content script 未載入（頁面在安裝擴充前就已開啟），需重新整理頁面。

訊息型別與 payload 統一定義在 `types/message.ts`；新增訊息請同時更新 `MESSAGE_TYPES`、background 的 switch 與對應 payload 型別。background listener 回傳 `true` 以支援非同步 `sendResponse`。

### 資料儲存

- `chrome.storage.local`：使用者設定（`services/settingsService.ts`，key `user-settings`）與截圖草稿。`services/chromeStorage.ts` 在非擴充環境（測試）會退回 mock。
- IndexedDB（`idb`）：兩個獨立資料庫 —— `switch-dress-db`（`imageService`，截圖圖片）與 `switchdress-photos`（`photoService`，個人照片，上限 3 張）。

### 分層慣例

元件不直接呼叫 Chrome API，經由 `hooks/`（`useScreenshot`、`useSettings`、`usePhotos`、`useImageStorage`）與 `services/` 包裝（見 `.specify/memory/constitution.md`）。圖示一律使用 `@iconify/react`。

路徑別名：`@` 對應 `src/`（例如 `import X from '@/components/X'`）。

建置輸出：`dist/` 目錄，`vite.config.ts` 以 `src/manifest.json` 作為 rollup input，由 `vite-plugin-chrome-extension` 處理。載入擴充套件請在 `chrome://extensions` 選「載入未封裝項目」指向 `dist/`。

## 技術棧

- TypeScript strict 模式、React 18、Vite、Tailwind CSS v4（`@tailwindcss/vite`）、@iconify/react、idb
- 測試：Vitest + @testing-library/react + jsdom
- 程式碼品質：ESLint + Prettier
- Chrome 擴充套件整合：vite-plugin-chrome-extension

## 功能規格

功能規劃文件位於 `specs/<編號-功能名稱>/`（目前 001–004，分支名稱與之對應，如 `004-popup-screenshot`），包含 spec.md、plan.md、data-model.md 及 checklists/。專案使用 spec-kit，流程技能在 `.claude/skills/speckit-*`，專案原則見 `.specify/memory/constitution.md`（元件優先、MV3、Vitest 測試優先、TypeScript strict、僅用 Icones 圖示）。

## spec-kit
所有的Markdown內容總是用中文撰寫 spec.md, task.md等等
