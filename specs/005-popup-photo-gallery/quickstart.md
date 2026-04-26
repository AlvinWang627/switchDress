# Quickstart: Popup Photo Gallery + AI Synthesis

**Feature**: 005-popup-photo-gallery | **Date**: 2026-04-26

---

## 新增安裝

```bash
npm install react-responsive-masonry
```

---

## 開發腳本

```bash
npm run dev      # 啟動 Vite 開發伺服器
npm run build    # 生產環境建置
npm test         # 執行 Vitest 測試
npm run typecheck # TypeScript 型別檢查
```

---

## 測試要徑

1. **Popup 個人照片顯示**
   - 在 Settings 頁面上傳個人照片
   - 開啟 Popup，確認照片正確顯示

2. **AI 合成流程**
   - 截圖選擇衣服區域
   - 選擇個人照片
   - 按下「AI 合成」
   - 關閉 Popup
   - 等待 Chrome 通知
   - 開啟相片集確認結果

3. **相片集功能**
   - 瀑布流顯示
   - 刪除照片
   - 最愛標記

---

## 依賴變更

| 套件 | 版本 | 用途 |
|------|------|------|
| `react-responsive-masonry` | latest | 瀑布流佈局 |
