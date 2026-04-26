# Research: Popup 截圖功能

**Feature**: 004-popup-screenshot
**Date**: 2026-04-26
**Status**: Complete

## Research Questions

### RQ-1: Chrome.tabs.captureVisibleTab API 行為與限制

**Decision**: 使用 `chrome.tabs.captureVisibleTab` 配合 `activeTab` 權限

**Rationale**:
- 這是 Chrome 擴充功能截圖的標準 API
- `activeTab` 權限在使用者觸發時自動授予，無需在安裝時請求
- 返回格式為 data URL (PNG)，可轉換為 Blob 進行記憶體儲存

**Alternatives considered**:
- `chrome.tabCapture` - 需要 `tabCapture` 權限且更複雜，不必要
- `drawfullscreen` canvas API - 需要 content script 注入，過度複雜

**Implementation approach**:
```typescript
// 在 background service worker 中處理截圖請求
chrome.tabs.captureVisibleTab({ format: 'png' })
  .then(dataUrl => {
    // dataUrl 轉換為 Blob
    const blob = await fetch(dataUrl).then(r => r.blob());
    return blob;
  });
```

---

### RQ-2: 選取框 UI 實作方式

**Decision**: 使用 HTML/CSS + React state 實作覆蓋層和選取框

**Rationale**:
- 現有架構使用 React + Tailwind CSS，保持一致性
- 選取框需要絕對定位、拖曳事件處理，純 CSS/HTML 即可達成
- 可重用現有的 icon 元件模式

**Alternatives considered**:
- Canvas 繪製 - 過度複雜，且 React 狀態管理更困難
- SVG 覆蓋 - 可行但學習曲線較高，效益不大

**Implementation approach**:
- 全屏覆蓋層：半透明黑色遮罩 (`bg-black/50`)
- 選取框：白色邊框，內部透明
- 拖曳：使用 `onMouseDown`, `onMouseMove`, `onMouseUp` 事件
- 調整大小：邊緣/角落的 8 個控制點

---

### RQ-3: 選取區域裁剪

**Decision**: 使用 Canvas API 在前端裁剪

**Rationale**:
- `chrome.tabs.captureVisibleTab` 已經截取整個可見區域
- 使用 Canvas drawImage + clip 可有效裁剪出選取區域
- 純前端處理，無需與 background 多次通訊

**Implementation approach**:
```typescript
function cropScreenshot(
  fullBlob: Blob,
  selection: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = selection.width;
      canvas.height = selection.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, selection.x, selection.y, selection.width, selection.height, 0, 0, selection.width, selection.height);
      canvas.toBlob(blob => resolve(blob!), 'image/png');
    };
    img.src = URL.createObjectURL(fullBlob);
  });
}
```

---

### RQ-4: 記憶體管理與生命週期

**Decision**: 使用 React useState + useEffect cleanup

**Rationale**:
- 規格要求截圖僅暫存於記憶體，關閉 popup 時刪除
- React 的 useEffect cleanup 非常適合處理這個生命週期
- 不需要額外的 IndexedDB 持久化

**Implementation approach**:
```typescript
function useScreenshot() {
  const [screenshot, setScreenshot] = useState<Blob | null>(null);

  // Popup 關閉時自動清除
  useEffect(() => {
    return () => {
      if (screenshot) {
        URL.revokeObjectURL(URL.createObjectURL(screenshot));
      }
    };
  }, [screenshot]);

  return { screenshot, setScreenshot };
}
```

---

### RQ-5: 與現有架構的整合

**Decision**: 建立獨立的 useScreenshot hook 和 ScreenshotOverlay 元件

**Rationale**:
- 章程要求元件必須獨立、可測試
- 現有的 `usePhotos`, `useImageStorage` hook 模式非常適合參考
- CameraIcon 已有基礎設施，只需擴展其功能

**Existing patterns to follow**:
1. `src/hooks/usePhotos.ts` - CRUD + state management pattern
2. `src/services/chromeStorage.ts` - Chrome API wrapper pattern
3. `src/components/CameraIcon/` - 獨立元件結構

---

## Technical Decisions Summary

| Category | Decision | Rationale |
|----------|----------|-----------|
| Screenshot API | `chrome.tabs.captureVisibleTab` | 標準 API，需要 `activeTab` 權限 |
| Selection UI | HTML/CSS + React events | 與現有架構一致，維護成本低 |
| Image cropping | Canvas API | 前端處理，效能足夠 |
| Memory management | React useState + cleanup | 符合生命週期需求 |
| Error handling | Toast/alert UI | 簡單直接，符合現有模式 |

## Open Questions (Resolved)

1. **Q: 是否需要新增權限?**
   - A: `activeTab` 已在 optional_permissions，無需修改 manifest

2. **Q: 選取框互動如何實作?**
   - A: 使用標準 mouse events，邊緣/角落 resize 控制點

3. **Q: 截圖如何傳遞到 popup?**
   - A: 透過 `chrome.runtime.sendMessage` 從 background 獲取 data URL

---

## References

- [Chrome tabs API - captureVisibleTab](https://developer.chrome.com/docs/extensions/reference/tabs/#method-captureVisible-tab)
- [Chrome manifest - activeTab permission](https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/)
