# Research: 003-settings-page

**Branch**: `003-settings-page` | **Date**: 2026-04-25

## Decisions

### Decision 1: 模型設定儲存方式
**Choice**: `chrome.storage.local`
**Rationale**: 簡潔的鍵值儲存，適合小型設定資料，與 Chrome 擴充功能原生整合
**Alternatives Considered**:
- IndexedDB: 過度複雜，設定僅需簡單鍵值
- localStorage: 不支援 service worker 背景執行

### Decision 2: 照片儲存方式
**Choice**: IndexedDB (使用 `idb` 庫)
**Rationale**: 需儲存 Blob 資料，IndexedDB 是瀏覽器標準解決方案
**Alternatives Considered**:
- chrome.storage.local: 有 10MB 限制，不適合大型 Blob
- File System Access API: 需要使用者授權，複雜度過高

### Decision 3: API Key 安全性
**Choice**: IndexedDB 明文儲存
**Rationale**: IndexedDB 無法完全防禦擴充功能本身的存取；將評估未來是否需要加密
**Alternatives Considered**:
- chrome.storage.session: 僅存在記憶體，關閉後消失，不符合「永久儲存」需求
- 加密儲存: 目前共識是不加密，視為下次改進項目

## Resolved Clarifications

| Question | Answer | Source |
|----------|--------|--------|
| 可用模型列表 | Nano banana2 (預設模型) | Session 2026-04-25 |
| 照片刪除方式 | 點擊刪除按鈕 | Session 2026-04-25 |
| API Key 安全性 | IndexedDB | Session 2026-04-25 |
| 照片解析度限制 | 5MB | Session 2026-04-25 |
| 照片尺寸驗證時機 | 不限制解析度 | Session 2026-04-25 |

## NEEDS CLARIFICATION Resolutions

All clarifications were resolved in the spec phase. No outstanding items.
