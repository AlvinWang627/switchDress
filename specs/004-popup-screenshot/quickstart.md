# Quickstart: Popup 截圖功能

**Feature**: 004-popup-screenshot
**Date**: 2026-04-26

## 啟動開發環境

```bash
npm run dev
```

這會啟動 Vite 開發伺服器，支援熱模組替換。

## 測試截圖功能

1. 點擊擴充功能圖示開啟 popup
2. 點擊相機圖示啟動截圖
3. 拖曳選取框選擇區域
4. 拖曳邊緣/角落調整大小
5. 按 Enter 或點擊確認完成截圖
6. 點擊截圖右上角 X 刪除

## 測試自動清除

1. 拍攝一張截圖
2. 關閉 popup (點擊外部)
3. 重新開啟 popup
4. 確認截圖已自動清除

## 測試錯誤處理

1. 斷開相機圖示連接 (mock error)
2. 觀察錯誤提示是否顯示

## 執行測試

```bash
npm test
```

## 檔案結構

```
src/
├── components/
│   └── ScreenshotOverlay/     # 新增: 選取覆蓋層
│       ├── ScreenshotOverlay.tsx
│       ├── SelectionBox.tsx
│       ├── SizeIndicator.tsx
│       └── ScreenshotOverlay.test.tsx
├── hooks/
│   └── useScreenshot.ts       # 新增: 截圖狀態管理
├── services/
│   └── captureService.ts      # 新增: chrome.tabs.captureVisibleTab 包裝
├── types/
│   └── screenshot.ts          # 新增: 截圖相關類型
└── popup/
    └── index.tsx              # 修改: 整合截圖功能
```

## 關鍵實作細節

### Hook: useScreenshot

```typescript
// src/hooks/useScreenshot.ts
const { screenshots, capture, remove, clearAll } = useScreenshot();
```

### Service: captureService

```typescript
// src/services/captureService.ts
const fullPageBlob = await captureService.captureCurrentTab();
```

### Component: ScreenshotOverlay

```typescript
// 在 popup/index.tsx 中條件渲染
{saptureState.status === 'selecting' && (
  <ScreenshotOverlay
    imageUrl={captureState.imageUrl}
    initialSelection={captureState.initialSelection}
    onConfirm={handleSelectionConfirm}
    onCancel={handleSelectionCancel}
  />
)}
```
