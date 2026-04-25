# 任務：基礎設施建置

**輸入**：來自 `/specs/001-package-short-name/` 的設計文件
**前置條件**：plan.md (必填), spec.md (使用者故事必填), research.md, data-model.md, quickstart.md

**組織方式**：任務依使用者故事分組，以支援獨立的實作與測試

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可平行執行（不同檔案，無相依性）
- **[Story]**：此任務所屬的使用者故事（如 US1、US2、US3）
- 描述中包含確切的檔案路徑

---

## 階段 1：設定（專案初始化）

**目的**：建立專案結構並初始化 npm 專案

- [X] T001 依 plan.md 建立專案目錄結構
- [X] T002 [P] 使用 package.json 初始化 npm 專案
- [X] T003 [P] 建立 tsconfig.json（嚴格模式設定）
- [X] T004 [P] 建立 vite.config.ts（使用 vite-plugin-chrome-extension）
- [X] T005 [P] 建立 Tailwind CSS 設定（tailwind.config.js、postcss.config.js）
- [X] T006 [P] 建立 Vitest 設定（vitest.config.ts）
- [X] T007 [P] 建立 ESLint 設定（.eslintrc.js）
- [X] T008 [P] 建立 Prettier 設定（.prettierrc）

**檢查點**：專案結構已建立 - 可進行依賴安裝

---

## 階段 2：基礎（依賴與核心設定）

**目的**：安裝所有依賴並建立 manifest

**⚠️ 關鍵**：在此階段完成前，不得開始任何使用者故事工作

- [X] T009 透過 npm 安裝 React 18+、@iconify/react、Tailwind CSS、Vitest 依賴
- [X] T010 [P] 建立 public/manifest.json（Manifest V3 設定）
- [X] T011 [P] 建立 src/types/ 目錄（含 manifest 類型）
- [X] T012 建立 src/components/.gitkeep 佔位檔
- [X] T013 建立 src/hooks/.gitkeep 佔位檔
- [X] T014 建立 src/services/.gitkeep 佔位檔
- [X] T015 建立 src/content/.gitkeep 佔位檔
- [X] T016 建立 src/background/.gitkeep 佔位檔
- [X] T017 建立 src/popup/.gitkeep 佔位檔
- [X] T018 建立 tests/components/.gitkeep、tests/hooks/.gitkeep、tests/integration/.gitkeep

**檢查點**：依賴已安裝，manifest 已建立 - 可進入使用者故事

---

## 階段 3：使用者故事 1 - 開發者設定本機環境（優先順序：P1）🎯 MVP

**目標**：開發者能夠透過 npm install 安裝依賴，並透過 npm run build 建置擴充功能

**獨立測試**：`npm install` 成功完成，`npm run build` 產生可載入的 dist/ 目錄

### 使用者故事 1 的測試（Vitest 測試框架驗證）⚠️

- [X] T019 [P] [US1] 在 tests/setup.ts 建立測試設定檔
- [X] T020 [P] [US1] 在 package.json 新增 npm scripts（dev、build、test、lint、format）

### 使用者故事 1 的實作

- [X] T021 [US1] 在 package.json 新增 npm scripts（dev、build、test、lint、format、test:coverage）
- [X] T022 [US1] 使用 tsc --noEmit 驗證 TypeScript 編譯
- [X] T023 [US1] 驗證 Vite 建置產生 dist/ 並含 manifest.json
- [X] T024 [US1] 執行 npm install 並確認所有依賴可解析
- [X] T025 [US1] 執行 npm run build 並驗證 dist/ 包含有效擴充功能

**檢查點**：npm install 和 npm run build 正常運作

---

## 階段 4：使用者故事 2 - 開發者啟動開發伺服器（優先順序：P2）

**目標**：開發者能夠啟動開發伺服器，具備熱重載能力

**獨立測試**：`npm run dev` 啟動伺服器，修改檔案後自動重新建置

### 使用者故事 2 的實作

- [X] T026 [P] [US2] 在 vite.config.ts 設定 vite-plugin-chrome-extension 的 HMR
- [X] T027 [US2] 在 src/popup/index.tsx 建立基本 popup 入口點
- [X] T028 [US2] 在 src/components/App.tsx 建立最小 App 元件
- [X] T029 [US2] 在 src/popup/index.tsx 設定 Tailwind CSS
- [ ] T030 [US2] 透過修改 src/popup/index.tsx 並驗證重建來測試熱重載

**檢查點**：npm run dev 具熱重載功能正常運作

---

## 階段 5：使用者故事 3 - 開發者在瀏覽器載入擴充功能（優先順序：P3）

**目標**：開發者能夠將建置好的擴充功能載入 Chrome 並正常運作

**獨立測試**：在 Chrome chrome://extensions/ 載入 dist/，擴充功能正常顯示無錯誤

### 使用者故事 3 的實作

- [X] T031 [P] [US3] 使用 popup 設定更新 manifest.json
- [X] T032 [P] [US3] 在 src/background/index.ts 建立背景服務 worker 入口
- [ ] T033 [US3] 驗證擴充功能在 Chrome 中無錯誤載入
- [ ] T034 [US3] 驗證 popup UI 在 Chrome 中正確渲染

**檢查點**：擴充功能成功載入 Chrome

---

## 階段 6：整理與橫切關注點

**目的**：最終驗證與文件

- [X] T035 [P] 新增 .gitignore（含 node_modules/、dist/、coverage/）
- [X] T036 [P] 驗證所有 npm scripts 正常運作
- [ ] T037 驗證 quickstart.md 指示是否正確
- [ ] T038 [P] 在 popup 新增 Icones 圖示渲染測試
- [X] T039 執行完整建置驗證：npm run build && npm run lint && npm test

---

## 相依性與執行順序

### 階段相依性

- **設定（階段 1）**：無相依性 - 可立即開始
- **基礎（階段 2）**：取決於設定完成 - 封鎖所有使用者故事
- **使用者故事（階段 3-5）**：全部取決於基礎階段完成
  - 基礎階段完成後，使用者故事可平行進行
- **整理（階段 6）**：取決於所有使用者故事完成

### 使用者故事相依性

- **使用者故事 1（P1）**：基礎階段後可開始 - 不依賴其他故事
- **使用者故事 2（P2）**：基礎階段後可開始 - 獨立於 US1
- **使用者故事 3（P3）**：基礎階段後可開始 - 獨立於 US1 和 US2

### 每個使用者故事內部

- 核心設定優於執行期驗證
- 建置驗證優於 HMR 驗證
- HMR 驗證優於 Chrome 載入測試

---

## 平行執行機會

- 所有標記 [P] 的設定任務可平行執行（T002-T008）
- 所有標記 [P] 的基礎佔位檔建立可平行執行（T010-T018）
- US1 測試設定和 npm scripts 標記 [P] 可平行執行（T019-T020）
- US3 manifest 和背景工作標記 [P] 可平行執行（T031-T032）
- 標記 [P] 的整理任務可平行執行（T035、T036、T038）

---

## 實作策略

### MVP 優先（僅使用者故事 1）

1. 完成階段 1：設定
2. 完成階段 2：基礎
3. 完成階段 3：使用者故事 1
4. **停止並驗證**：npm install 和 npm run build 正常運作
5. 如已就緒則部署/展示

### 增量交付

1. 完成設定 + 基礎 → 基礎就緒
2. 加入使用者故事 1 → 測試 npm install/build → 部署/展示（MVP！）
3. 加入使用者故事 2 → 測試開發伺服器 → 部署/展示
4. 加入使用者故事 3 → 測試 Chrome 載入 → 部署/展示

---

## 摘要

| 項目 | 數量 |
|------|------|
| 總任務數 | 39 |
| 階段 1（設定） | 8 |
| 階段 2（基礎） | 10 |
| 階段 3（US1 - 開發環境） | 7 |
| 階段 4（US2 - 開發伺服器） | 5 |
| 階段 5（US3 - 瀏覽器載入） | 4 |
| 階段 6（整理） | 5 |

### 建議 MVP 範圍

僅實作使用者故事 1（階段 3），即完成：
- npm install 可正常運作
- npm run build 可產生有效的 dist/ 目錄

此為最小可用基礎設施。
