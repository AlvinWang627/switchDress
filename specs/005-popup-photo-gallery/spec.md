# Feature Specification: Popup頁面及相片集

**Feature Branch**: `005-popup-photo-gallery`
**Created**: 2026-04-26
**Status**: Draft
**Input**: User description: "實作popup頁面及相片集"

## Clarifications

### Session 2026-04-26

- Q: 衣服圖片來源 → A: A (Screenshot)
- Q: API Key 存儲方式 → A: chrome.storage.local
- Q: AI合成中途關閉Popup的行為 → A: A (Continue in background)
- Q: 相片集存儲上限 → A: D (無上限，僅受Chrome存儲配額限制)
- Q: 背景任務完成通知機制 → A: A (Chrome Notification)
- Q: 相片集存儲方式 → A: IndexedDB (大容量本地儲存)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 個人照片展示與選擇 (Priority: P1)

使用者在Popup頁面中可以查看並選擇自己的個人照片作為AI合成素材。

**Why this priority**: 個人照片是AI虛擬試穿的基礎素材，必須能從設定頁面取得並在Popup中呈現。

**Independent Test**: 可獨立測試個人照片是否正確從Settings頁面取得並顯示在Popup中。

**Acceptance Scenarios**:

1. **Given** 使用者已設定個人照片，**When** 開啟Popup頁面，**Then** 系統顯示使用者的個人照片
2. **Given** 使用者尚未設定個人照片，**When** 開啟Popup頁面，**Then** 系統顯示預設占位圖片或提示使用者前往設定

---

### User Story 2 - AI服裝合成功能 (Priority: P1)

使用者選擇衣服照片與個人照片後，按下AI合成按鈕，系統產生虛擬試穿結果並自動存入相片集。

**Why this priority**: 這是核心功能，讓使用者能夠將衣服「穿」在自己身上。

**Independent Test**: 可獨立測試AI合成流程，從選擇圖片到產出結果並存入相片集。

**Acceptance Scenarios**:

1. **Given** 使用者已選擇衣服照片和個人照片，**When** 按下AI合成按鈕，**Then** 系統顯示處理中狀態
2. **Given** AI合成成功，**When** 系統產出結果圖片，**Then** 圖片自動存入相片集並顯示成功提示
3. **Given** AI合成失敗，**When** 系統收到錯誤回應，**Then** 顯示錯誤訊息並允許使用者重試

---

### User Story 3 - 相片集瀏覽与管理 (Priority: P2)

使用者可在全頁面相片集瀏覽所有AI合成後的照片，並可刪除不想要的照片或標記為最愛。

**Why this priority**: 提供便利的圖片管理功能，讓使用者能整理和回顧自己的虛擬試穿作品。

**Independent Test**: 可獨立測試相片集的瀑布式顯示、刪除和收藏功能。

**Acceptance Scenarios**:

1. **Given** 使用者進入相片集頁面，**When** 頁面載入，**Then** 以瀑布式佈局顯示所有合成照片
2. **Given** 使用者觀看合成照片，**When** 點擊右上角刪除按鈕，**Then** 照片從相片集移除
3. **Given** 使用者觀看合成照片，**When** 點擊左上角星星圖示，**Then** 照片被標記為最愛，星星變為已點亮狀態

---

### Edge Cases

- ~~當使用者在AI合成過程中關閉Popup頁面，已進行的合成任務是否應取消或繼續完成？~~ → 繼續在背景執行（Background Service Worker），完成後發送Chrome通知
- 當網路連線不穩定導致AI合成超時，系統應如何處理？ → 顯示錯誤訊息並允許使用者重試
- 當相片集圖片數量過多時，瀑布式載入的性能優化策略為何？ → 虛擬滾動（Virtual Scrolling）或分頁載入
- 當使用者刪除已被標記為最愛的照片時，是否需要額外確認？ → 直接刪除，不需額外確認

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統必須從Settings頁面的個人照片Section取得使用者上傳的個人照片
- **FR-002**: 系統必須在Popup頁面顯示個人照片供使用者確認選擇
- **FR-003**: 使用者必須能透過截圖方式選擇衣服圖片作為AI合成素材
- **FR-004**: 系統必須使用Google AI Studio Gemini API執行虛擬試穿合成
- **FR-005**: 系統必須從Settings取得AI模型名稱和API Key
- **FR-006**: AI合成Prompt必須包含「Virtual try-on: Put the clothing from image A onto the person in image B...」內容
- **FR-007**: 合成後的圖片必須自動存入相片集
- **FR-008**: 系統必須提供獨立的相片集全頁面供使用者瀏覽
- **FR-009**: 相片集必須以瀑布式（Masonry）佈局顯示圖片
- **FR-010**: 使用者必須能刪除相片集中的照片（右上角刪除按鈕）
- **FR-011**: 使用者必須能將照片標記為最愛（左上角星星按鈕）
- **FR-012**: 系統必須將相片集資料永久本地存儲（IndexedDB），支援大容量存儲，不會過期或自動刪除

### Key Entities *(include if feature involves data)*

- **個人照片 (PersonalPhoto)**: 使用者在Settings設定的個人照片，包含圖片資料和相關元資料
- **合成照片 (GeneratedPhoto)**: AI虛擬試穿產出的照片，包含：原個人照片ID、原衣服照片ID、合成結果圖片、創建時間、是否最愛
- **設定資料 (Settings)**: 包含個人照片、AI模型名稱（gemini-3-flash-preview等）、API Key

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者可在Popup頁面成功取得並顯示個人照片，載入時間不超過2秒
- **SC-002**: AI合成功能完成後，產出的圖片自動出現在相片集中
- **SC-003**: 相片集頁面能正確以瀑布式佈局顯示10張以上圖片
- **SC-004**: 使用者能成功刪除不需要的合成照片，刪除操作反應時間不超過500ms
- **SC-005**: 使用者能成功標記最愛照片，狀態變更即時反映
- **SC-006**: 背景AI合成完成後，系統發送Chrome通知告知用戶

## Assumptions

- 使用者已在Settings頁面完成Google AI API Key的設定
- 使用者已在Settings頁面上傳個人照片
- AI合成需要穩定的網路連線，系統應處理連線失敗的情況
- 圖片存儲使用IndexedDB，支援大容量存儲（相較於Chrome Storage的5MB配額）
- 瀑布式佈局使用開源函式庫或自定義CSS Grid实现
- API Key使用chrome.storage.local存儲（未加密）
- AI合成任務在背景Service Worker執行，完成後透過Chrome Notification通知用戶
