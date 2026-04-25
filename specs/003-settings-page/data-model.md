# Data Model: 003-settings-page

**Branch**: `003-settings-page` | **Date**: 2026-04-25

## Entities

### UserSettings

使用者模型設定。

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `model` | `string` | 必填，預設 `"nano-banana2"` | 模型選擇 |
| `apiKey` | `string` | 必填，非空白 | API Key |

**Storage**: `chrome.storage.local` (key: `"user-settings"`)

---

### PersonalPhoto

個人照片記錄。

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `id` | `string` | UUID v4 | 唯一識別碼 |
| `blob` | `Blob` | 必填，最大 5MB | 圖片資料 |
| `name` | `string` | 選填 | 原始檔案名稱 |
| `type` | `string` | `"image/jpeg"` / `"image/png"` | MIME 類型 |
| `uploadedAt` | `number` | Unix timestamp | 上傳時間 |

**Storage**: IndexedDB (database: `"switchdress-photos"`, store: `"photos"`)

**Constraint**: 最多 3 張照片

---

## State Transitions

### UserSettings Lifecycle
```
[empty] → [filled] → [saved] → [loaded on page open]
              ↓
         [modified] → [saved again]
```

### PersonalPhoto Lifecycle
```
[empty] → [photo uploaded] → [displayed] → [deleted]
                                    ↓
                              [3 photos max]
```

---

## Indexing

- PersonalPhoto by `id`: Primary key (IndexedDB)
- PersonalPhoto by `uploadedAt`: For display ordering
