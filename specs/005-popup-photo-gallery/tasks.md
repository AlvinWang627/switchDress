# Task Checklist: Popup Photo Gallery + AI Synthesis

**Feature**: 005-popup-photo-gallery
**Generated**: 2026-04-26
**Total Tasks**: 28

---

## Phase 1: Setup

**Purpose**: Install required dependencies

- [x] T001 [P] Install `react-responsive-masonry` library
- [x] T002 [P] Install `@google/genai` SDK package

---

## Phase 2: Foundational

**Purpose**: Core types and services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Extend `ImageRecord` type with `isFavorite` field in src/types/popup.ts
- [x] T004 [P] Add `updateImage`, `getAllImagesSorted` methods to imageService in src/services/imageService.ts
- [x] T005 [P] Add message types `AI_SYNTHESIZE`, `TOGGLE_FAVORITE`, `SHOW_NOTIFICATION` to src/types/message.ts
- [x] T006 Define `GeneratedPhoto` entity with fields: id, blob, thumbnail, timestamp, isFavorite, sourcePersonalPhotoId, sourceClothingDataUrl in src/types/gallery.ts
- [x] T007 [P] Create `notificationService.ts` with `showSynthesisComplete()` and `showError()` using chrome.notifications API in src/services/notificationService.ts
- [x] T008 Create `useNotification.ts` hook wrapper in src/hooks/useNotification.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 個人照片展示與選擇 (P1)

**Story Goal**: 使用者在Popup頁面中可以查看並選擇自己的個人照片作為AI合成素材

**Independent Test**: 可獨立測試個人照片是否正確從Settings頁面取得並顯示在Popup中

- [x] T009 [P] [US1] Create `usePersonalPhoto` hook to retrieve personal photo from settings in src/hooks/usePersonalPhoto.ts
- [x] T010 [P] [US1] Create `PersonalPhotoSelector` component in src/components/PersonalPhotoSelector.tsx
- [x] T011 [US1] Update popup/index.tsx to display personal photo section with fallback placeholder
- [ ] T012 [US1] Test personal photo retrieval and display in popup

---

## Phase 4: User Story 2 - AI服裝合成功能 (P1)

**Story Goal**: 使用者選擇衣服照片與個人照片後，按下AI合成按鈕，系統產生虛擬試穿結果並自動存入相片集

**Independent Test**: 可獨立測試AI合成流程，從選擇圖片到產出結果並存入相片集

- [x] T013 [P] [US2] Implement `geminiService.ts` using `@google/genai` SDK with GoogleGenAI class, `synthesizeImage(personBlob, clothingDataUrl, apiKey, model)` returns image blob from inlineData in response.candidates[0].content.parts in src/services/geminiService.ts
- [x] T014 [P] [US2] Create `useAISynthesis` hook with state machine: idle | capturing | synthesizing | success | error in src/hooks/useAISynthesis.ts
- [x] T015 [US2] Add AI_SYNTHESIZE message handler in src/background/index.ts that receives base64 images, calls geminiService, stores result in IndexedDB, sends Chrome notification
- [x] T016 [US2] Update AIActionButton in popup/index.tsx to connect to useAISynthesis, show synthesis progress/status
- [x] T017 [US2] Test AI synthesis flow end-to-end

---

## Phase 5: User Story 3 - 相片集瀏覽与管理 (P2)

**Story Goal**: 使用者可在全頁面相片集瀏覽所有AI合成後的照片，並可刪除不想要的照片或標記為最愛

**Independent Test**: 可獨立測試相片集的瀑布式顯示、刪除和收藏功能

- [x] T018 [P] [US3] Create `MasonryGallery` component using react-responsive-masonry with ResponsiveMasonry and Masonry in src/components/MasonryGallery.tsx
- [x] T019 [P] [US3] Create `GalleryItem` component with delete button (top-right) and favorite star (top-left) in src/components/GalleryItem.tsx
- [x] T020 [P] [US3] Create gallery page entry src/gallery/index.html with proper manifest configuration
- [x] T021 [P] [US3] Create gallery root component src/gallery/index.tsx
- [x] T022 [P] [US3] Create gallery styles src/gallery/index.css with Masonry layout support
- [x] T023 [US3] Update src/manifest.json to include gallery page configuration
- [x] T024 [US3] Add "Album" button in popup/index.tsx header to open gallery page
- [x] T025 [US3] Connect GalleryItem delete action to imageService.deleteImage
- [x] T026 [US3] Connect GalleryItem favorite toggle to TOGGLE_FAVORITE message
- [x] T027 [US3] Test gallery masonry layout, delete, and favorite functionality

---

## Phase 6: Testing

- [ ] T028 [P] Add tests for geminiService, notificationService, useAISynthesis, MasonryGallery, and GalleryItem

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Run `npm run typecheck` — verify TypeScript compilation
- [ ] T030 [P] Run `npm run lint` — verify ESLint passes
- [ ] T031 Run `npm test` — ensure all tests pass
- [ ] T032 Manual verification per spec.md acceptance scenarios

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← Can test independently after this phase
    ↓
Phase 3 (US1) ← Can be tested independently
Phase 4 (US2) ← Can run parallel with US1
Phase 5 (US3) ← Can run parallel with US1/US2
    ↓
Phase 6 (Testing)
    ↓
Phase 7 (Polish)
```

---

## Parallel Execution Examples

**Parallel Group A** (Phase 2 - different files, no dependencies):
- T003: Extend ImageRecord type
- T004: Update imageService
- T005: Add message types
- T006, T007: Define entities and services

**Parallel Group B** (User stories after foundation - all can run parallel):
- US1 tasks (T009-T012)
- US2 tasks (T013-T017)
- US3 tasks (T018-T027)

---

## Implementation Strategy

**MVP Scope**: User Story 1 (T009-T012) + foundational types and services

**Incremental Delivery**:
1. Phase 1-2: Foundation complete
2. Phase 3: US1 delivers personal photo in popup
3. Phase 4: US2 adds AI synthesis capability
4. Phase 5: US3 adds full gallery page
5. Phase 6-7: Testing and polish

---

## Verification

- `npm run typecheck` — TypeScript 編譯無誤
- `npm run lint` — ESLint 檢查通過
- `npm test` — 所有 Vitest 測試通過
- Manual: Popup 個人照片顯示、AI 合成流程、相片集瀑布流、刪除、最愛功能