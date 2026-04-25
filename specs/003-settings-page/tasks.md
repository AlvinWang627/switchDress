# Tasks: 003-settings-page

**輸入**: 來自 `/specs/003-settings-page/` 的設計文件
**前置條件**: plan.md（必填）, spec.md（必填，內有使用者故事）, research.md, data-model.md, quickstart.md

**組織方式**: 任務依使用者故事分組，確保每個故事可獨立實作與測試

## 格式: `[ID] [P?] [Story] 描述`

- **[P]**: 可平行執行（不同檔案、無相依性）
- **[Story]**: 所屬的使用者故事（例如 US1, US2, US3）
- 描述中需包含完整檔案路徑

---

## Phase 1: 專案初始化

**目的**: 驗證現有專案結構，確認 Chrome 擴充功能已設定 options page

- [x] T001 驗證 options page 入口點位於 `src/options/index.html` 與 `src/manifest.json`
- [x] T002 [P] 為 options page 安裝與設定 Tailwind CSS
- [x] T003 [P] 安裝 `idb` 函式庫作為 IndexedDB 包裝

---

## Phase 2: 基礎建設（封鎖先決條件）

**目的**: 核心服務與類型定義，所有使用者故事實作前**必須**完成

**⚠️ 重要**: 使用者故事實作前，必須完成此階段

- [x] T004 在 `src/types/index.ts` 定義 `UserSettings` 與 `PersonalPhoto` 的 TypeScript 介面
- [x] T005 [P] 實作 `src/services/chromeStorage.ts` 中的 `chromeStorage` 輔助函式
- [x] T006 [P] 實作 `settingsService.ts`，包含 `saveSettings()` 與 `loadSettings()` 函式
- [x] T007 [P] 使用 idb 實作 `photoService.ts`，包含 `savePhoto()`, `getPhotos()`, `deletePhoto()` 函式
- [x] T008 實作圖片驗證工具 `src/utils/validation.ts`（validatePhoto：JPEG/PNG 格式、5MB 限制）
- [x] T009 建立 `src/hooks/useSettings.ts` 自訂 hooks
- [x] T010 建立 `src/hooks/usePhotos.ts` 自訂 hooks

**檢查點**: 基礎建設完成 → 可開始平行實作使用者故事

---

## Phase 3: 使用者故事 1 - 儲存模型設定（優先級: P1）🎯 MVP

**目標**: 使用者可以輸入 API Key、選擇模型，並永久儲存設定

**獨立測試**: 可單獨測試模型設定的儲存和讀取流程

### 使用者故事 1 的實作

- [x] T011 [P] [US1] 建立 `ModelSelector` 元件於 `src/options/components/ModelSelector.tsx`
- [x] T012 [P] [US1] 建立 `ApiKeyInput` 元件於 `src/options/components/ApiKeyInput.tsx`（含顯示/隱藏切換）
- [x] T013 [US1] 在 `src/options/components/SettingsSection.tsx` 實作模型設定區塊 UI
- [x] T014 [US1] 整合 useSettings hook：頁面載入時讀取設定、按鈕點擊時儲存
- [x] T015 [US1] 新增儲存操作的成功/錯誤 toast 通知

**檢查點**: 使用者故事 1 應可完整功能並獨立測試

---

## Phase 4: 使用者故事 2 - 上傳個人照片（優先級: P1）

**目標**: 使用者可以上傳最多 3 張個人照片，並永久保存在 IndexedDB

**獨立測試**: 可單獨測試照片上傳和顯示功能

### 使用者故事 2 的實作

- [x] T016 [P] [US2] 建立 `PhotoSlot` 元件於 `src/options/components/PhotoSlot.tsx`
- [x] T017 [P] [US2] 建立 `PhotoUploader` 元件於 `src/options/components/PhotoUploader.tsx`
- [x] T018 [US2] 在 `src/options/components/PhotosSection.tsx` 實作 3 槽位的照片區塊 UI
- [x] T019 [US2] 整合 usePhotos hook：頁面載入時讀取照片列表
- [x] T020 [US2] 實作檔案輸入處理，含格式驗證（僅 JPEG/PNG）
- [x] T021 [US2] 在槽位中顯示上傳照片為縮圖
- [x] T022 [US2] 新增「已達照片數量上限」錯誤處理

**檢查點**: 使用者故事 1 與 2 應可同時獨立運作

---

## Phase 5: 使用者故事 3 - 刪除個人照片（優先級: P2）

**目標**: 使用者可以刪除已上傳的個人照片

**獨立測試**: 可單獨測試照片刪除功能

### 使用者故事 3 的實作

- [x] T023 [P] [US3] 在 `PhotoSlot` 元件新增帶圖示的刪除按鈕
- [x] T024 [US3] 實作刪除 handler，呼叫 `photoService.deletePhoto()`
- [x] T025 [US3] 更新 `usePhotos` hook，刪除後重新整理列表
- [x] T026 [US3] 刪除前新增確認提示（可選的 UX 優化）

**檢查點**: 所有使用者故事應可獨立運作

---

## Phase 6: 使用者故事 4 - 整合設定頁面（優先級: P1）

**目標**: 整合所有元件成完整設定頁面

### 實作

- [x] T027 [P] 在 `src/options/components/SettingsPage.tsx` 建立主 `SettingsPage` 元件
- [x] T028 [P] 將 ModelSelector、ApiKeyInput、PhotosSection 組合進 SettingsPage
- [x] T029 在 `src/options/index.tsx` 新增頁面標題「switchDress設定」
- [x] T030 [P] 使用 Tailwind 樣式確保響應式佈局

**檢查點**: 完整設定頁面可進行測試

---

## Phase 7: 打磨與跨領域關注點

**目的**: 影響多個使用者故事的優化

- [x] T031 [P] 新增非同步操作中的載入狀態
- [x] T032 [P] 新增錯誤邊界與錯誤處理 UI
- [x] T033 效能優化：圖片懶載入、元件 memoization
- [ ] T034 ~~無障礙功能：新增 aria-labels、照片槽位鍵盤導航~~（不需做）
- [ ] T035 執行 quickstart.md 驗證步驟

---

## 相依性與執行順序

### 階段相依性

- **Phase 1（初始化）**: 無相依 — 可立即開始
- **Phase 2（基礎建設）**: 依賴 Phase 1 完成 — **封鎖所有使用者故事**
- **Phase 3-6（使用者故事）**: 全部依賴 Phase 2 完成
  - 完成後可平行實作（視團隊人數）
  - 或依優先順序順序實作
- **Phase 7（打磨）**: 依賴所有使用者故事完成

### 使用者故事相依性

- **使用者故事 1（P1）**: Phase 2 完成後可開始 — 不依賴其他故事
- **使用者故事 2（P1）**: Phase 2 完成後可開始 — 不依賴 US1，可獨立測試
- **使用者故事 3（P2）**: Phase 2 完成後可開始 — 依賴 US2 UI 存在
- **使用者故事 4（P1）**: Phase 2 完成後可開始 — 整合 US1、US2、US3 元件

### 每個使用者故事內部順序

- 模型/服務 → UI 元件
- 核心實作 → 整合
- 故事完成 → 進入下一優先級

### 平行執行機會

- Phase 2 中標記 [P] 的任務可平行執行（T004, T005, T006, T007）
- US1 元件（T011, T012）可平行
- US2 元件（T016, T017）可平行
- US3 元件（T023）可與其他階段平行
- 打磨任務（T031, T032, T033）可平行

---

## 平行範例：使用者故事 1

```bash
# 同時啟動所有基礎建設服務：
Task: "實作 chromeStorage 輔助函式於 src/services/chromeStorage.ts"
Task: "實作 settingsService.ts，包含 saveSettings() 與 loadSettings()"
Task: "建立 useSettings 自訂 hook 於 src/hooks/useSettings.ts"

# 同時啟動 US1 所有 UI 元件：
Task: "建立 ModelSelector 元件於 src/options/components/ModelSelector.tsx"
Task: "建立 ApiKeyInput 元件於 src/options/components/ApiKeyInput.tsx"
```

---

## 實作策略

### MVP 優先（使用者故事 1 + 4 整合）

1. 完成 Phase 1：初始化
2. 完成 Phase 2：基礎建設（重要 — 封鎖所有故事）
3. 完成 Phase 3：使用者故事 1（模型設定）
4. 完成 Phase 6：整合
5. **停止並驗證**：獨立測試使用者故事 1 + 整合
6. 部署/展示

### 漸進式交付

1. 完成 Phase 1 + Phase 2 → 基礎建設完成
2. 加入使用者故事 1 → 獨立測試 → 部署/展示（MVP！）
3. 加入使用者故事 2 → 獨立測試 → 部署/展示
4. 加入使用者故事 3 → 獨立測試 → 部署/展示
5. 每個故事新增價值且不破壞既有功能

---

## 建議 MVP 範圍

**MVP = 使用者故事 1 + 使用者故事 4（整合）**

理由：模型設定是核心功能，沒有它擴充功能無法運作。MVP 提供可運作的設定頁面，讓使用者可儲存模型配置。

---

## 總任務數統計

| 階段 | 任務數 | 內容 |
|------|--------|------|
| Phase 1（初始化） | 3 | 專案結構驗證、安裝依賴 |
| Phase 2（基礎建設） | 7 | 核心服務與 hooks（封鎖所有故事） |
| Phase 3（US1 - 儲存模型設定） | 5 | ModelSelector、ApiKeyInput、SettingsSection |
| Phase 4（US2 - 上傳個人照片） | 7 | PhotoSlot、PhotoUploader、PhotosSection |
| Phase 5（US3 - 刪除個人照片） | 4 | 刪除按鈕與 handler |
| Phase 6（US4 - 整合） | 4 | SettingsPage 整合 |
| Phase 7（打磨） | 5 | 效能優化（無障礙功能不需做） |

**總計: 34 tasks（已完成: 33，不需做: 1，待驗證: 1）**

---

## 每個故事的獨立測試標準

- **US1**: 儲存設定 → 重新開啟頁面 → 設定保持
- **US2**: 上傳照片 → 重新開啟頁面 → 照片顯示
- **US3**: 刪除照片 → 重新開啟頁面 → 照片移除
- **US4**: 完整頁面載入 → 所有區塊正確渲染

---

## 實作成品

### 已建立的檔案

| 檔案 | 用途 |
|------|------|
| `src/types/index.ts` | UserSettings, PersonalPhoto 類型定義 |
| `src/services/chromeStorage.ts` | Chrome storage 輔助函式 |
| `src/services/settingsService.ts` | 模型設定儲存服務 |
| `src/services/photoService.ts` | 照片儲存服務（IndexedDB） |
| `src/utils/validation.ts` | 圖片驗證工具 |
| `src/hooks/useSettings.ts` | 設定管理 hook |
| `src/hooks/usePhotos.ts` | 照片管理 hook |
| `src/options/components/ModelSelector.tsx` | 模型選擇元件 |
| `src/options/components/ApiKeyInput.tsx` | API Key 輸入元件（含顯示/隱藏） |
| `src/options/components/SettingsSection.tsx` | 模型設定區塊 |
| `src/options/components/PhotoSlot.tsx` | 照片槽位元件 |
| `src/options/components/PhotoUploader.tsx` | 照片上傳元件 |
| `src/options/components/PhotosSection.tsx` | 照片區塊（含 3 槽位） |
| `src/options/components/SettingsPage.tsx` | 設定頁面主元件 |
| `src/options/index.tsx` | Options 頁面入口 |
| `src/manifest.json` | 更新以包含 options_page |

### 修改過的檔案

| 檔案 | 變更 |
|------|------|
| `src/manifest.json` | 新增 `options_page` 設定 |
| `src/options/index.html` | 更新標題為「switchDress設定」 |
