# Quickstart: SwitchDress Chrome Extension Development

## 環境需求

- **Node.js**: v22.15.0 或更高版本
- **npm**: 隨 Node.js 附帶
- **Chrome**: 最新版本（用於測試）

## 快速開始

### 1. 複製專案

```bash
git clone <repository-url>
cd switchDress
git checkout 001-base-infrastructure
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開發伺服器啟動後，會監控檔案變更並自動重新建置。

### 4. 在 Chrome 中載入擴充功能

1. 開啟 Chrome，進入 `chrome://extensions/`
2. 開啟「開發人員模式」
3. 點擊「載入未封裝」
4. 選擇專案中的 `dist` 資料夾

### 5. 建置生產版本

```bash
npm run build
```

輸出將產生在 `dist/` 目錄。

## 可用指令

| 指令 | 說明 |
|------|------|
| `npm install` | 安裝所有依賴 |
| `npm run dev` | 啟動開發伺服器（熱重載） |
| `npm run build` | 建置生產版本 |
| `npm run lint` | 執行 ESLint 檢查 |
| `npm run lint:fix` | 自動修復 ESLint 問題 |
| `npm run format` | 執行 Prettier 格式化 |
| `npm run test` | 執行 Vitest 測試 |
| `npm run test:watch` | 執行測試（監控模式） |
| `npm run test:coverage` | 執行測試並產生覆蓋率報告 |

## 專案結構

```
switchDress/
├── src/
│   ├── components/      # React 元件
│   ├── hooks/           # 自訂 hooks
│   ├── services/        # 商業邏輯
│   ├── types/           # TypeScript 類型
│   ├── content/         # Content scripts
│   ├── background/      # Service worker
│   └── popup/           # Popup UI
├── public/
│   └── manifest.json    # 擴充功能資訊清單
├── dist/                # 建置輸出
├── tests/               # 測試檔案
├── vite.config.ts       # Vite 設定
├── tsconfig.json        # TypeScript 設定
├── vitest.config.ts     # Vitest 設定
├── tailwind.config.js   # Tailwind CSS 設定
├── postcss.config.js    # PostCSS 設定
└── package.json
```

## 章程合規

本專案遵循 SwitchDress 章程：

- **元件優先架構**: 所有 UI 元素為獨立可測試的 React 元件
- **Manifest V3 合規**: 使用 service workers
- **Vitest 測試優先**: 測試檔案與原始碼放在一起
- **TypeScript 嚴格模式**: 不使用 `any` 類型
- **Icones 圖示庫**: 所有圖示使用 @iconify/react

## 疑難排解

### npm install 失敗

- 確認 Node.js 版本：`node -v`（需 v22.15.0+）
- 清除 npm 快取：`npm cache clean --force`
- 刪除 node_modules 後重試：`rm -rf node_modules && npm install`

### 擴充功能無法載入

- 確認已開啟「開發人員模式」
- 確認 dist/ 目錄存在且有內容
- 檢查 Chrome 擴充功能頁面是否有錯誤訊息

### 熱重載不工作

- 確認開發伺服器正在執行
- 可能在 content scripts 需手動重新載入擴充功能
