---

description: "Task list for 004-popup-screenshot feature implementation"
---

# Tasks: Popup 截圖功能

**Input**: Design documents from `/specs/004-popup-screenshot/`
**Prerequisites**: plan.md, spec.md (with user stories P1-P3), research.md, data-model.md
**Tech Stack**: TypeScript (strict), React 18, Vite, Tailwind CSS, @iconify/react, vite-plugin-chrome-extension, Vitest

**Tests**: The spec explicitly requests Vitest tests - write tests FIRST, ensure they FAIL before implementation per constitution gate III.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for this feature

- [ ] T001 [P] Create `src/types/screenshot.ts` with ScreenshotData, SelectionRect, SelectionState, CaptureError, ScreenshotOverlayProps, ScreenshotPreviewProps types per data-model.md
- [ ] T002 [P] Modify `src/types/message.ts` to add CaptureTabRequest and CaptureTabResponse message types per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create `src/services/captureService.ts` implementing chrome.tabs.captureVisibleTab wrapper with error handling per research.md
- [ ] T004 Create `src/hooks/useScreenshot.ts` with screenshot state management, capture, remove, and cleanup on unmount per research.md
- [ ] T005 [P] Modify `src/background/index.ts` to add CAPTURE_TAB message handler responding with dataUrl and dimensions

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 截圖拍攝 (Priority: P1) 🎯 MVP

**Goal**: 使用者點擊相機圖示後，系統截圖並顯示可拖曳調整的選取框

**Independent Test**: 點擊相機圖示，驗證截圖選取介面正確顯示，並完成選取操作

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation per constitution gate III**

- [ ] T006 [P] [US1] Write failing test for ScreenshotOverlay in `src/components/ScreenshotOverlay/ScreenshotOverlay.test.tsx`
- [ ] T007 [P] [US1] Write failing test for SelectionBox in `src/components/ScreenshotOverlay/SelectionBox.test.tsx`

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create `src/components/ScreenshotOverlay/ScreenshotOverlay.tsx` with semi-transparent overlay mask and selection box container
- [ ] T009 [P] [US1] Create `src/components/ScreenshotOverlay/SelectionBox.tsx` with drag-to-move and 8 resize handles (nw, n, ne, e, se, s, sw, w)
- [ ] T010 [P] [US1] Create `src/components/ScreenshotOverlay/SizeIndicator.tsx` showing real-time width x height during selection
- [ ] T011 [US1] Implement selection drag logic with boundary constraints (selection must stay within viewport) per FR-011
- [ ] T012 [US1] Implement resize handles with minimum size 50x50 per FR-008 and size warning per FR-012
- [ ] T013 [US1] Add Enter key confirm and Escape key cancel handlers per acceptance criteria
- [ ] T014 [US1] Implement Canvas API cropping using selection coordinates per research.md
- [ ] T015 [US1] Modify `src/popup/index.tsx` to integrate CameraIcon trigger and ScreenshotOverlay conditional rendering

**Checkpoint**: User Story 1 fully functional - can capture screenshot with selection UI

---

## Phase 4: User Story 2 - 截圖預覽與刪除 (Priority: P2)

**Goal**: 截圖完成後，使用者可在 popup 中預覽並隨時刪除

**Independent Test**: 完成截圖後，驗證截圖是否正確顯示，並測試刪除功能

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US2] Write failing test for ScreenshotPreview in `src/components/ScreenshotPreview.test.tsx`

### Implementation for User Story 2

- [ ] T017 [P] [US2] Create `src/components/ScreenshotPreview.tsx` displaying cropped screenshot blob with hover-reveal delete button (X icon top-right) per assumptions
- [ ] T018 [US2] Integrate ScreenshotPreview into ClothingAreaCard area in `src/popup/index.tsx`
- [ ] T019 [US2] Implement delete button click handler calling useScreenshot.remove() per FR-007
- [ ] T020 [US2] Add hover state for delete button visibility per acceptance criterion 1

**Checkpoint**: User Story 2 fully functional - screenshots display and can be deleted

---

## Phase 5: User Story 3 - 自動刪除機制 (Priority: P3)

**Goal**: 關閉 popup 時，截圖自動被刪除，確保隱私

**Independent Test**: 關閉 popup 後重新開啟，驗證截圖是否已被清除

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US3] Write failing test for auto-cleanup in `src/hooks/useScreenshot.test.ts`

### Implementation for User Story 3

- [ ] T022 [US3] Implement useEffect cleanup in `src/hooks/useScreenshot.ts` to revoke object URLs on unmount per research.md memory management decision
- [ ] T023 [US3] Verify popup close triggers unmount and cleanup per acceptance criterion 1

**Checkpoint**: User Story 3 fully functional - screenshots auto-delete on popup close

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T024 [P] Run `npm run typecheck` to verify TypeScript strict mode compliance
- [ ] T025 [P] Run `npm test` to verify all tests pass
- [ ] T026 Run `npm run dev` for manual testing per quickstart.md scenarios
- [ ] T027 [P] Update relevant documentation if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 → US2 → US3 (sequential, as each builds on previous)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires Phase 2 foundational work - Can start immediately after
- **User Story 2 (P2)**: Requires US1 completion (ScreenshotPreview displays captured screenshots)
- **User Story 3 (P3)**: Requires US2 completion (cleanup of displayed screenshots)

### Within Each User Story

- Tests MUST be written and FAIL before implementation per constitution
- Types/Services before Hooks
- Hooks before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 (Setup) can run in parallel
- T006 and T007 (US1 tests) can run in parallel
- T008, T009, T010 (US1 components) can run in parallel
- T016 (US2 tests) can run parallel to US1 implementation
- T024 and T025 (Polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: T006 - Write failing test for ScreenshotOverlay
Task: T007 - Write failing test for SelectionBox

# Launch all components for User Story 1 together:
Task: T008 - Create ScreenshotOverlay.tsx
Task: T009 - Create SelectionBox.tsx
Task: T010 - Create SizeIndicator.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing per constitution gate III
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Task Count Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Setup | 2 |
| Phase 2 | Foundational | 3 |
| Phase 3 | User Story 1 - 截圖拍攝 | 10 |
| Phase 4 | User Story 2 - 截圖預覽與刪除 | 5 |
| Phase 5 | User Story 3 - 自動刪除機制 | 3 |
| Phase 6 | Polish | 4 |
| **Total** | | **27** |
