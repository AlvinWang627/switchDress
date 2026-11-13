import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chromeExtension } from 'vite-plugin-chrome-extension';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), chromeExtension(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // vite-plugin-chrome-extension 不會從 manifest 的 side_panel.default_path 推導入口，
      // 需額外列出側邊欄頁面（輸出為 dist/sidepanel/index.html，與 manifest 的路徑一致）。
      // 必須用物件形式：外掛處理陣列 input 時有 bug（splice 誤把 manifest 當成額外入口，其餘被丟棄）。
      input: {
        manifest: 'src/manifest.json',
        'sidepanel/index': 'src/sidepanel/index.html',
      },
    },
  },
});
