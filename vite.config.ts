import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chromeExtension } from 'vite-plugin-chrome-extension';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), chromeExtension(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/manifest.json',
    },
  },
});
