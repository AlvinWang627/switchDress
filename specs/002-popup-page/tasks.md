# Tasks: popup-page

**Input**: Design documents from `/specs/002-popup-page/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無相依性）
- **[Story]**: 所屬的使用者故事（例如：US1, US2, US3）
- 描述中需包含完整檔案路徑

---

## Phase 1: Setup (共用基礎建設)

**Purpose**: 專案初始化與基本結構

- [x] T001 驗證/更新 src/manifest.json 中的 popup 入口設定

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 在任何使用者故事實作前必須完成的核心基礎建設

**⚠️ CRITICAL**: 在此階段完成前，不得開始任何使用者故事工作

- [x] T002 [P] 在 src/types/popup.ts 中定義 PopupWindow 和 CameraIcon 類型
- [x] T003 [P] 在 src/types/message.ts 中定義 Message 類型與常數
- [x] T004 [P] 在 src/services/imageService.ts 中實作 imageService，使用 idb 處理 IndexedDB 操作
- [x] T005 [P] 在 src/hooks/useImageStorage.ts 中實作 useImageStorage hook
- [x] T006 在 src/background/index.ts 中建立背景腳本訊息處理常式

**Checkpoint**: 基礎建設完成 - 使用者故事實作可以開始並行

---

## Phase 3: User Story 1 - 開啟與檢視彈出頁面 (Priority: P1) 🎯 MVP

**Goal**: 使用者在 Chrome 工具列上點擊擴充功能圖示，彈出頁面隨即開啟，顯示帶有相機圖示的主頁面介面

**Independent Test**: 點擊擴充功能圖示並驗證彈出頁面正確呈現

### Implementation for User Story 1

- [x] T007 [P] [US1] 在 src/components/CameraIcon/CameraIcon.tsx 中建立 CameraIcon 元件
- [x] T008 [P] [US1] 在 src/components/CameraIcon/types.ts 中建立 CameraIcon props 介面
- [x] T009 [US1] 在 src/popup/index.tsx 中實作 popup 根元件
- [x] T010 [US1] 在 src/popup/index.tsx 中使用 Tailwind CSS 新增深色模式樣式
- [x] T011 [US1] 驗證 popup 與 Chrome 擴充功能操作的開啟/關閉行為

**Checkpoint**: 此時，User Story 1 應該可以完整運作並獨立測試

---

## Phase 4: User Story 2 - 相機互動 (Priority: P2)

**Goal**: 使用者可以在彈出頁面上看到並與相機圖示互動

**Independent Test**: 驗證相機圖示在彈出頁面上可見且點擊時無動作（no-op）

### Implementation for User Story 2

- [x] T012 [P] [US2] 在 src/components/CameraIcon/CameraIcon.tsx 中新增相機圖示點擊處理常式（no-op）
- [x] T013 [P] [US2] 在 src/components/CameraIcon/CameraIcon.tsx 中新增無障礙屬性（aria-label）
- [x] T014 [US2] 在 src/popup/index.tsx 中整合 useImageStorage hook 以顯示圖片列表

**Checkpoint**: 此時，User Stories 1 和 2 都應該能獨立運作

---

## Phase 5: User Story 3 - 彈性佈局 (Priority: P3)

**Goal**: 彈出頁面在不同螢幕尺寸下正確顯示，並保持適當的佈局

**Independent Test**: 在不同寬度下開啟彈出頁面並驗證佈局保持功能正常

### Implementation for User Story 3

- [x] T015 [P] [US3] 在 src/popup/index.tsx 中使用 Tailwind 新增回應式佈局樣式
- [x] T016 [P] [US3] 在 src/popup/index.tsx 中新增 max-height 與 overflow 處理以符合 Chrome popup 限制
- [x] T017 [US3] 在 src/popup/index.tsx 中新增可滾動的內容容器

**Checkpoint**: 所有使用者故事現在應該都能獨立運作

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 影響多個使用者故事的改進項目

- [x] T018 [P] 在 src/components/CameraIcon/CameraIcon.test.tsx 中新增 CameraIcon 的 Vitest 元件測試
- [x] T019 [P] 視需要更新 src/manifest.json 中的 popup 尺寸設定
- [x] T020 執行 lint 與 typecheck 驗證程式碼品質

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 取決於 Setup 完成 - 封鎖所有使用者故事
- **User Stories (Phase 3+)**: 所有取決於 Foundational 完成
  - 使用者故事之後可並行進行（若有足夠人力）
  - 或依優先順序依序進行（P1 → P2 → P3）
- **Polish (Final Phase)**: 取決於所有使用者故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational（Phase 2）後開始 - 不依賴其他故事
- **User Story 2 (P2)**: 可在 Foundational（Phase 2）後開始 - 可與 US1 整合但需能獨立測試
- **User Story 3 (P3)**: 可在 Foundational（Phase 2）後開始 - 可與 US1/US2 整合但需能獨立運作

### Within Each User Story

- 類型先於服務
- 服務先於 hooks
- Hooks 先於元件
- 元件先於整合
- 完成一個故事後再進入下一個優先順序

### Parallel Opportunities

- T002、T003、T004、T005 都可以並行執行（不同檔案，無相依性）
- T007、T008 可以並行執行（元件 + 類型）
- T012、T013 可以並行執行（同一檔案，不同 props）
- T015、T016 可以並行執行（同一檔案，不同樣式）

---

## Parallel Example: User Story 1

```bash
# 同時啟動所有基礎建設類型/服務任務：
Task: "在 src/types/popup.ts 中定義 PopupWindow 和 CameraIcon 類型"
Task: "在 src/types/message.ts 中定義 Message 類型與常數"
Task: "在 src/services/imageService.ts 中實作 imageService"
Task: "在 src/hooks/useImageStorage.ts 中實作 useImageStorage hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（重要 - 封鎖所有故事）
3. 完成 Phase 3: User Story 1
4. **停止並驗證**：獨立測試 User Story 1
5. 部署/展示（若已就緒）

### Incremental Delivery

1. 完成 Setup + Foundational → 基礎建設就緒
2. 加入 User Story 1 → 獨立測試 → 部署/展示（MVP！）
3. 加入 User Story 2 → 獨立測試 → 部署/展示
4. 加入 User Story 3 → 獨立測試 → 部署/展示
5. 每個故事新增價值且不破壞先前故事

---

## Summary

- **總任務數**: 20
- **User Story 1 任務**: 5（T007-T011）
- **User Story 2 任務**: 3（T012-T014）
- **User Story 3 任務**: 3（T015-T017）
- **基礎建設任務**: 5（T002-T006）
- **設定任務**: 1（T001）
- **整備任務**: 3（T018-T020）
- **可並行執行**: 8 對任務已識別
- **建議 MVP 範疇**: User Story 1（Phase 3）
- **格式驗證**: ✅ 所有任務遵循檢查清單格式（核取方塊、ID、標籤、檔案路徑）
