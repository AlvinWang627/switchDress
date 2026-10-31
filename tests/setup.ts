import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 圖示在 jsdom 內不需真的渲染；以帶有 data-icon 的 span 取代，方便斷言
vi.mock('@iconify/react', () => ({
  Icon: ({ icon, className }: { icon: string; className?: string }) =>
    React.createElement('span', { 'data-testid': 'icon', 'data-icon': icon, className }),
}));

// react-responsive-masonry 在 vitest 下載入會因 ESM/CJS 互通出錯（"Cannot redefine property"），
// 且排版本身不在我們的測試範圍，改以直接渲染子元素的版本取代
vi.mock('react-responsive-masonry', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'masonry' }, children);
  return { default: passthrough, ResponsiveMasonry: passthrough };
});

// jsdom 未實作 URL.createObjectURL / revokeObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

afterEach(() => {
  cleanup();
});
