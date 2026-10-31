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
