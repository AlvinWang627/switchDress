# Research: Base Infrastructure Setup

## Decisions Made

| 決策 | 理由 | 替代方案 |
|------|------|----------|
| npm 作為套件管理器 | Node.js 官方附帶，無需額外安裝，生態系最大 | yarn, pnpm |
| Node.js v22.15.0 | LTS 版本，穩定且支援現代功能 | v20 LTS |
| Vitest 作為測試框架 | 現代快速，與 Vite 原生整合，適合 Chrome 擴充功能 | Jest |
| ESLint + Prettier | 兩者互補，統一程式碼風格與品質標準 | 單獨使用其一 |
| @iconify/react + Icônes | 提供大量一致風格的圖示，tree-shaking 支援 | 自訂 SVG |
| Tailwind CSS | 快速開發，與 Vite 整合良好 | CSS Modules |
| React 18+ | 章程指定，成熟穩定 | - |
| Vite + vite-plugin-chrome-extension | 章程指定，熱重載支援良好 | - |

## 技術棧確認

依據章程規定，基礎設施使用以下技術：

- **框架**: React 18+ (章程 III)
- **打包工具**: Vite + vite-plugin-chrome-extension (章程)
- **測試**: Vitest + React Testing Library (章程 III)
- **圖示庫**: @iconify/react (章程 IV)
- **語言**: TypeScript 嚴格模式 (章程 IV)
- **樣式**: Tailwind CSS
- **程式碼品質**: ESLint + Prettier
- **Manifest**: Version 3 (章程 II)

## 無需進一步研究

所有技術決策已在澄清階段確認，無 NEEDS CLARIFICATION 標記。
