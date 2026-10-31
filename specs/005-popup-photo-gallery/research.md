# Research: Popup Photo Gallery + AI Synthesis

**Feature**: 005-popup-photo-gallery | **Date**: 2026-04-26

---

## 1. react-responsive-masonry with React 18 + TypeScript + Vite

**Decision**: 使用 `react-responsive-masonry`

**Rationale**:
- 使用者指定
- 與 React 18 + TypeScript + Vite 完全相容
- 提供 `ResponsiveMasonry` 包裝元件，支援自訂斷點

**Alternatives considered**:
- `react-masonry-css` — 需要更多自訂樣式
- CSS Grid — 無法實現真正瀑布流效果

**Usage Pattern**:
```tsx
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

<ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
  <Masonry gutter="12px">
    {images.map(img => <img key={img.id} src={img.src} />)}
  </Masonry>
</ResponsiveMasonry>
```

**Pitfall**: 這是 CSS flexbox 模擬的瀑布流，不是絕對定位的 Pinterest 風格。

---

## 2. Google Gemini API from Chrome Extension Service Worker

**Decision**: 使用 Gemini 1.5 Flash API

**Rationale**:
- 使用者指定串接 Google AI
- Gemini 1.5 Flash 速度快速、適合影像處理

**API Endpoint**:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}
```

**Critical Pattern — Blob Transfer Limitation**:
Service Worker 無法直接接收 Blob。必須在傳送前轉為 base64：
```typescript
// 傳送端（popup/content）
const reader = new FileReader();
reader.readAsDataURL(blob);
reader.onloadend = () => {
  chrome.runtime.sendMessage({ type: 'AI_SYNTHESIZE', payload: { dataUrl: reader.result } });
};

// 接收端（background service worker）
// 直接使用 dataUrl（已是 data:image/png;base64,... 格式）
```

**Request Body**:
```typescript
{
  contents: [{
    parts: [
      { text: "Virtual try-on: Put the clothing from image A onto the person in image B..." },
      { inline_data: { mime_type: "image/png", data: base64String } }
    ]
  }]
}
```

**Error Handling**:
- 網路超時：顯示錯誤訊息，允許重試
- API 錯誤：回傳錯誤訊息至 popup

---

## 3. Chrome Notifications in Manifest V3

**Decision**: 使用 `chrome.notifications.create()`

**Required Permission**:
```json
"permissions": ["notifications"]
```

**Pattern**:
```typescript
chrome.notifications.create('synthesis-complete', {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
  title: 'AI 合成完成',
  message: '虛擬試穿結果已存入相片集',
  priority: 0
});
```

**Key Constraints**:
- `iconUrl` 必須是擴充套件內資源 URL 或 data URL
- Service Worker 只能運行約 30 秒，通知可用於喚醒 worker

---

## 4. Existing useScreenshot Blob Handling

**Current Pattern**: Screenshot → base64 → chrome.storage.local → 取出 → Blob

**Issue Found**: URL.createObjectURL 建立的 URL 未妥善釋放，造成記憶體洩漏。

**Pattern to Follow**:
```typescript
// 儲存 blob 和 objectUrl
const objectUrl = URL.createObjectURL(blob);
setImages(prev => [...prev, { blob, objectUrl, id }]);

// 元件卸載時釋放
useEffect(() => {
  return () => URL.revokeObjectURL(objectUrl);
}, [objectUrl]);
```

---

## Unresolved

（無）
