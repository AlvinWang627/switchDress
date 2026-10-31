# Data Model: Popup Photo Gallery + AI Synthesis

**Feature**: 005-popup-photo-gallery | **Date**: 2026-04-26

---

## Entities

### 1. GeneratedPhoto (相片集照片)

繼承自 `ImageRecord`，擴展以下欄位：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | `string` | 主鍵，UUID |
| `blob` | `Blob` | 合成結果圖片 |
| `thumbnail` | `Blob` | 縮圖（可選） |
| `timestamp` | `number` | 創建時間（毫秒） |
| `isFavorite` | `boolean` | 是否標記為最愛 |
| `sourcePersonalPhotoId` | `string` | 來源個人照片 ID |
| `sourceClothingDataUrl` | `string` | 來源衣服截圖（base64 data URL） |

**Validation**:
- `id`: 非空 UUID
- `isFavorite`: 預設 `false`
- `timestamp`: 使用 `Date.now()`

**State Transitions**:
- 新增時：`isFavorite = false`
- 刪除：直接移除，無確認（規格書 edge case）
- 最愛切換：`true` ↔ `false`

---

### 2. SynthesisRequest (AI 合成請求)

| 欄位 | 類型 | 說明 |
|------|------|------|
| `personalPhotoBlob` | `Blob` | 個人照片 |
| `clothingDataUrl` | `string` | 衣服截圖（base64 data URL） |
| `apiKey` | `string` | Gemini API Key |
| `model` | `string` | 模型名稱（如 `gemini-1.5-flash`） |

---

### 3. UserSettings (現有)

| 欄位 | 類型 | 說明 |
|------|------|------|
| `model` | `string` | Gemini 模型名稱 |
| `apiKey` | `string` | API Key（chrome.storage.local 明文儲存） |

---

## IndexedDB Schema

**Database**: `switch-dress-db` (現有)

**Store**: `images`

| 欄位 | 類型 | 索引 |
|------|------|------|
| `id` | string | Primary Key |
| `blob` | Blob | |
| `thumbnail` | Blob | |
| `timestamp` | number | |
| `isFavorite` | boolean | |
| `sourcePersonalPhotoId` | string | |
| `sourceClothingDataUrl` | string | |

---

## Relationships

```
UserSettings
  └── apiKey, model → 供 AI 合成使用

PersonalPhoto (from settings)
  └── id → 來源於 Settings 頁面上傳

GeneratedPhoto
  ├── sourcePersonalPhotoId → PersonalPhoto.id
  └── sourceClothingDataUrl → 截圖時產生
```
