# Feature Specification: 設定頁面

**Feature Branch**: `003-settings-page`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "003 設定頁面 由上到下 1. 標題 2.模型設定 3.個人照片(可以上傳3張) 1. 標題 switchDress設定 2. 模型設定section 可以選擇模型 及input api key 有儲存模型按鈕 3. 個人照片可以上傳3張 之後永久儲存"

## Clarifications

### Session 2026-04-25

- Q: 可用模型列表 → A: Nano banana2 (預設模型)
- Q: 照片刪除方式 → A: 點擊刪除按鈕
- Q: API Key 安全性 → A: IndexedDB
- Q: 照片解析度限制 → A: 5MB
- Q: 照片尺寸驗證時機 → A: 不限制解析度

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 儲存模型設定 (Priority: P1)

使用者進入設定頁面，輸入 API Key，選擇模型，然後點擊儲存。系統將設定持久化，使用者下次進入時設定保持不變。

**Why this priority**: 核心功能 - 沒有模型設定，整個擴充功能無法正常運作

**Independent Test**: 可以單獨測試模型設定的儲存和讀取流程

**Acceptance Scenarios**:

1. **Given** 使用者首次開啟設定頁面，**When** 輸入有效的 API Key 並選擇模型，**Then** 系統顯示儲存成功提示
2. **Given** 使用者已儲存過設定，**When** 再次開啟設定頁面，**Then** API Key 和模型選擇保持上次設定值
3. **Given** 使用者輸入 API Key 後未儲存就關閉頁面，**Then** 設定不被保存

---

### User Story 2 - 上傳個人照片 (Priority: P1)

使用者進入設定頁面，在個人照片區塊點擊上傳按鈕，選擇本地圖片檔案。系統將圖片永久儲存，並顯示在設定頁面中。

**Why this priority**: 核心功能 - 個人照片是用於 AI 試穿功能的前提

**Independent Test**: 可以單獨測試照片上傳和顯示功能

**Acceptance Scenarios**:

1. **Given** 使用者首次進入設定頁面，**When** 點擊上傳按鈕並選擇圖片，**Then** 圖片顯示在設定頁面中
2. **Given** 使用者已上傳 3 張照片，**When** 再點擊上傳按鈕，**Then** 系統提示已達上限
3. **Given** 使用者已上傳照片，**When** 重新開啟設定頁面，**Then** 已上傳的照片仍然顯示

---

### User Story 3 - 刪除個人照片 (Priority: P2)

使用者可以刪除已上傳的個人照片，釋放儲存空間。

**Why this priority**: 重要但不緊急 - 提供照片管理能力

**Independent Test**: 可以單獨測試照片刪除功能

**Acceptance Scenarios**:

1. **Given** 使用者已上傳 2 張照片，**When** 刪除其中 1 張，**Then** 該照片從設定頁面消失，剩餘 1 張
2. **Given** 使用者已上傳照片，**When** 刪除照片後重新開啟頁面，**Then** 刪除的確認持久化

---

### Edge Cases

- 上傳非圖片格式的檔案時，系統應顯示錯誤提示
- API Key 輸入框應支援隱藏/顯示切換
- 網路錯誤或儲存失敗時，系統應顯示錯誤訊息
- 照片上傳失敗時，系統應顯示錯誤提示並保留上傳入口
- 照片刪除透過點擊照片上的刪除按鈕觸發

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 顯示「switchDress設定」標題
- **FR-002**: 系統 MUST 在模型設定區塊顯示模型下拉選單（預設：Nano banana2）
- **FR-003**: 系統 MUST 在模型設定區塊顯示 API Key 輸入框
- **FR-004**: 系統 MUST 在模型設定區塊顯示「儲存模型」按鈕
- **FR-005**: 系統 MUST 在使用者點擊「儲存模型」後，將 API Key 和模型選擇持久化到本地儲存
- **FR-006**: 系統 MUST 在使用者再次開啟設定頁面時，自動載入已儲存的 API Key 和模型選擇
- **FR-007**: 系統 MUST 在個人照片區塊顯示 3 個照片上傳卡槽
- **FR-008**: 系統 MUST 支援使用者上傳 JPEG、PNG 格式的圖片檔案
- **FR-009**: 系統 MUST 在照片上傳後，將圖片資料 Blob 持久化到 IndexedDB
- **FR-010**: 系統 MUST 在使用者再次開啟設定頁面時，顯示已上傳的照片
- **FR-011**: 系統 MUST 限制每位使用者最多上傳 3 張照片
- **FR-012**: 系統 MUST 提供刪除已上傳照片的功能

### Key Entities *(include if feature involves data)*

- **UserSettings**: 使用者的模型設定，包含模型選擇和 API Key
- **PersonalPhoto**: 使用者的個人照片記錄，包含圖片 Blob 和元資料

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者能在 30 秒內完成模型設定的輸入和儲存
- **SC-002**: 設定頁面載入時間不超過 2 秒
- **SC-003**: 照片上傳失敗時，系統在 1 秒內顯示錯誤提示
- **SC-004**: 儲存的設定在擴充套件重啟後仍然保留
- **SC-005**: 上傳的照片在擴充套件重啟後仍然顯示

## Assumptions

- 使用者了解如何取得 API Key
- 照片檔案大小上限為 5MB
- 瀏覽器 IndexedDB 配額足夠儲存 3 張照片
- API Key 使用 IndexedDB 加密儲存
