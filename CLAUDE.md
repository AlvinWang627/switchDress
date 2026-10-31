# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開發指令

```bash
npm run dev       # Vite 開發伺服器；頁面在 /src/popup/index.html 等路徑，沒有 chrome API
npm run build     # 生產環境建置，輸出至 dist/
npm run preview   # 本地預覽建置結果
npm test          # Vitest（watch 模式；單次執行用 npx vitest run）
npm run lint      # eslint .（.eslintrc.cjs 未設定 TS parser，ESLint 8 預設只掃 .js，目前不會檢查 .ts/.tsx；也不含 Prettier）
npm run format    # Prettier 格式化 src/ 與 tests/
npm run typecheck # tsc --noEmit（tsconfig 只 include src/）
```

執行單一測試：`npx vitest run tests/hooks/useScreenshot.test.ts`（加 `-t "名稱"` 可依測試名稱過濾）；`npm run test:coverage` 產生覆蓋率。

### 測試慣例

- 測試位於 `tests/`（依 `src/` 結構分資料夾），`src/**/*.test.tsx` 也會被收集。
- `tests/setup.ts` 全域處理：`fake-indexeddb`（IndexedDB 服務用真實實作測試）、`@iconify/react` mock（圖示渲染為帶 `data-icon` 的 `span`）。
- Chrome API 用 `tests/helpers/chrome.ts` 的 `installChromeMock()`（記憶體版 `storage.local`，並暴露已註冊的 `onMessage` listeners）；測試結束要 `uninstallChromeMock()`。若被測 hook 卸載時會用到 `chrome`，須先 `cleanup()` 再移除 mock。
- `chromeStorage.ts`、`imageService.ts`、`photoService.ts` 帶有模組層級快取，測試需 `vi.resetModules()` 後再動態 `import`（IndexedDB 另以 `new IDBFactory()` 重置）。
- `vi.mock` 工廠內若要引用外部變數，必須用 `vi.hoisted()`。mock 的 hook 回傳值要是穩定參照（例如 `SettingsSection` 以 `[settings]` 為 effect 相依，每次回傳新物件會造成無限重新渲染）。

## 架構概覽

Chrome 擴充套件（Manifest V3），React + TypeScript。`src/` 下有五個執行環境，各自是獨立入口（自行 `createRoot` 掛載，CSS 以 `?inline` 匯入後注入 `<style>`）：

- **popup/** — 彈出視窗。根元件是 `popup/index.tsx` 內的 `PopupApp`（`Header`、`ClothingAreaCard`、`AIActionButton` 也定義在同檔）；`components/App.tsx` 是早期佔位元件，popup 沒有使用。
- **background/** — Service Worker（`background/index.ts`）。單一 `onMessage` listener 依 `MESSAGE_TYPES` 分派；負責 `chrome.tabs.captureVisibleTab`（`CAPTURE_TAB`）與 `GET_IMAGES` / `SAVE_IMAGE`。
- **content/** — Content script（`content/index.tsx`），注入所有頁面。收到 `START_OVERLAY` 後向 background 要截圖，再把 `ScreenshotOverlay` 掛到 Shadow DOM（樣式來自 `style/index.css`，避免與宿主頁面互相污染）。
- **options/** — 設定頁（API Key、模型選擇、個人照片上傳），popup 的齒輪按鈕以 `chrome.runtime.openOptionsPage` 開啟。
- **gallery/** — 相片集（瀑布流、收藏、刪除），popup 以 `chrome.tabs.create(chrome.runtime.getURL('gallery/index.html'))` 開啟；列在 manifest 的 `web_accessible_resources`。

popup / options / gallery / background 同屬擴充套件 origin，直接透過 `services/` 存取同一份 IndexedDB；只有 content script 跑在宿主頁面 origin，必須經由訊息或 `chrome.storage` 與其他環境溝通。非擴充環境（`npm run dev`、測試）中程式以 `chrome.runtime?.id` 判斷，改走 `window.open('/src/...')` 等退路。

### 截圖流程（跨環境，需讀多個檔案才能理解）

popup（`hooks/useScreenshot.ts`）→ `chrome.tabs.sendMessage(START_OVERLAY)` 給 content script → content 送 `CAPTURE_TAB` 給 background 取得 dataUrl → 使用者在 overlay 框選 → content 將結果以 base64 存入 `chrome.storage.local.draftScreenshot`（popup 此時已關閉）→ 使用者再次開啟 popup 時，`useScreenshot` 在 mount 時讀取 `draftScreenshot` 還原成 Blob 預覽。`isCapturing` 為流程旗標。若 content script 未載入（頁面在安裝擴充前就已開啟），需重新整理頁面。

### AI 合成流程

popup「AI 合成」按鈕 → `useAISynthesis.synthesize(個人照片 Blob, 截圖 Blob, apiKey, model)` → `services/geminiService.ts` 以 `fetch` 直接呼叫 Gemini REST `models/{model}:generateContent`（`responseModalities: ['IMAGE']`，沒有使用已安裝的 `@google/genai`）→ 結果以 `ImageRecord`（含 `isFavorite`）存入 `imageService` → gallery 頁顯示。合成在 popup 內執行，popup 關閉會中斷請求。預設模型 `gemini-3.1-flash-image-preview`（`useSettings` 與 `options/components/ModelSelector.tsx`）。

background 也有 `AI_SYNTHESIZE` handler（完成後存圖並發 `chrome.notifications`），但 popup 目前沒有呼叫它。

### 訊息

訊息型別與 payload 定義在 `types/message.ts`；新增訊息請同時更新 `MESSAGE_TYPES`、background 的 switch 與對應 payload 型別。background listener 回傳 `true` 以支援非同步 `sendResponse`。`CAPTURE_SCREENSHOT` 回傳未實作；`TOGGLE_FAVORITE`、`SHOW_NOTIFICATION` 只有定義，background 沒有處理（gallery 直接呼叫 `imageService.updateImage`）。

### 資料儲存

- `chrome.storage.local`：使用者設定（`services/settingsService.ts`，key `user-settings`）、截圖草稿 `draftScreenshot` 與旗標 `isCapturing`。`services/chromeStorage.ts` 在非擴充環境（測試）會退回 mock。
- IndexedDB（`idb`）：兩個獨立資料庫 —— `switch-dress-db`（`imageService`，相片集 / AI 合成結果）與 `switchdress-photos`（`photoService`，個人照片，上限 3 張）。

### 分層與專案原則

- 元件不直接呼叫 Chrome API，經由 `hooks/` 與 `services/` 包裝。
- 跨環境共用型別放 `types/`；TypeScript strict，避免 `any`（必要時以註解說明理由）。
- 圖示一律使用 `@iconify/react`，不自製 SVG。
- 權限在 manifest 以 `permissions` / `optional_permissions` 宣告（`tabs`、`scripting` 為 optional）。

路徑別名：`@` 對應 `src/`（例如 `import X from '@/components/X'`）。

建置輸出：`dist/` 目錄，`vite.config.ts` 以 `src/manifest.json` 作為 rollup input，由 `vite-plugin-chrome-extension` 處理。載入擴充套件請在 `chrome://extensions` 選「載入未封裝項目」指向 `dist/`。

## 技術棧

- TypeScript strict 模式、React 18、Vite、Tailwind CSS v4（`@tailwindcss/vite`）、@iconify/react、idb、react-responsive-masonry（gallery）
- 測試：Vitest + @testing-library/react + jsdom
- 程式碼品質：ESLint + Prettier
- Chrome 擴充套件整合：vite-plugin-chrome-extension

## 功能規格

功能規劃文件位於 `specs/<編號-功能名稱>/`（目前 001–005，分支名稱與之對應，如 `005-popup-photo-gallery`），包含 spec.md、plan.md、data-model.md、tasks.md 及 checklists/。專案使用 spec-kit，流程技能在 `.claude/skills/speckit-*`。

## spec-kit
所有的Markdown內容總是用中文撰寫 spec.md, task.md等等
