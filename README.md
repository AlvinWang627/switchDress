# SwitchDress - AI 虛擬試穿瀏覽器擴充功能

SwitchDress 是一款基於 Google Gemini AI 技術的 Chrome 擴充功能，讓使用者可以在瀏覽網頁時，隨時選取感興趣的衣物，並透過 AI 技術將其「穿」在指定的模特兒或個人照片上。

[demo](https://reurl.cc/mpkq37)
## 🌟 主要功能

- **網頁選區擷取**：直接在任何網頁上透過拖曳選框，精準擷取服飾圖片。
- **AI 虛擬試穿 (Virtual Try-on)**：利用 Google Gemini 的多模態模型能力，將擷取的衣物自然地合成到人物照片上。
- **個人化畫廊**：自動儲存合成結果，支援收藏與管理。
- **隱私優先**：圖片資料儲存在本地 IndexedDB 中，確保隱私安全。
- **靈活配置**：支援設定個人的 Gemini API Key 與模型選擇。

## 🛠️ 技術棧

- **核心框架**：React 18 + TypeScript
- **建構工具**：Vite + `vite-plugin-chrome-extension`
- **樣式設計**：Tailwind CSS
- **AI 引擎**：Google Gemini API (`@google/genai`)
- **本地儲存**：IndexedDB (透過 `idb` 庫)
- **圖示系統**：Iconify

## 🚀 開發與安裝

### 前置作業
1. 確保已安裝 [Node.js](https://nodejs.org/) (建議 v18 以上)。
2. 取得 [Google Gemini API Key](https://aistudio.google.com/app/apikey)。

### 安裝步驟
1. 複製本專案：
   ```bash
   git clone <repository-url>
   cd switchDress
   ```
2. 安裝依賴：
   ```bash
   npm install
   ```
3. 編譯專案：
   ```bash
   npm run build
   ```
4. 在 Chrome 中載入：
   - 開啟 Chrome 瀏覽器，進入 `chrome://extensions/`。
   - 開啟右側的「開發者模式」。
   - 點擊「載入解壓縮擴充功能」，選擇專案中的 `dist` 資料夾。

### 開發模式
```bash
npm run dev
```

## 📖 使用指南

1. **設定 API Key**：
   - 點擊擴充功能彈窗右上角的 **齒輪圖示** 進入「設定」頁面。
   - 輸入您的 Google Gemini API Key 並儲存。
2. **準備個人照片**：
   - 在主介面中上傳或選擇一張您想要進行試穿的人物照片（建議背景簡單、人物姿勢端正）。
3. **擷取網頁服飾**：
   - 點擊右上角的 **相機圖示** 進入擷取模式。
   - 在當前網頁中拖曳選取您感興趣的衣物區域。
4. **生成試穿照**：
   - 確認已選取服飾與個人照片後，點擊下方的「**AI 合成**」按鈕。
   - AI 將根據兩張圖片生成試穿效果，完成後會自動儲存。
5. **瀏覽與管理**：
   - 點擊右上角的 **相簿圖示** 進入「畫廊」查看所有歷史記錄。
   - 您可以在畫廊中查看大圖、收藏喜好的結果或刪除不想要的圖片。

## 📄 授權條款

本專案採用 [MIT License](LICENSE) 授權。
