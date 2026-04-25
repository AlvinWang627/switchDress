# Data Model: Base Infrastructure Setup

## Overview

本檔案記錄基礎設施建置階段的資料模型。由於基礎設施專注於開發工具和建置流程設定，不涉及業務資料模型。

## Chrome Extension 資料結構

### Manifest V3 配置

```typescript
interface ChromeExtensionManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  optional_permissions?: string[];
  host_permissions?: string[];
  action?: {
    default_icon?: Record<string, string>;
    default_title?: string;
    default_popup?: string;
  };
  background?: {
    service_worker: string;
    type?: 'module';
  };
  content_scripts?: Array<{
    matches: string[];
    js?: string[];
    css?: string[];
    run_at?: 'document_start' | 'document_end' | 'document_idle';
  }>;
  icons?: Record<string, string>;
  options_page?: string;
  options_ui?: {
    page: string;
    open_in_tab?: boolean;
  };
}
```

### 專案類型定義

```typescript
// src/types/manifest.ts
interface ExtensionConfig {
  manifestVersion: 3;
  name: string;
  version: string;
  description?: string;
}

// 擴充功能權限類型
type Permission = 'storage' | 'tabs' | 'activeTab' | 'scripting' | string;
```

## 測試資料模型

### 測試設定檔案結構

```typescript
// vitest.config.ts 結構
interface VitestConfig {
  test: {
    globals?: boolean;
    environment?: 'jsdom' | 'node';
    setupFiles?: string[];
    include?: string[];
    coverage?: {
      provider?: 'v8' | 'istanbul';
      reporter?: string[];
    };
  };
}
```

## 備註

基礎設施建置階段主要涉及設定檔案（package.json, vite.config.ts, tsconfig.json, vitest.config.ts 等），具體業務資料模型將在後續功能開發階段定義。
