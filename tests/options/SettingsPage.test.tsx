import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// 回傳值必須是穩定參照：SettingsSection 以 [settings] 為 effect 相依，
// 若每次渲染都回傳新物件會造成無限重新渲染。
const mocks = vi.hoisted(() => {
  const settingsState = {
    settings: { model: 'nano-banana2', apiKey: '' },
    isLoading: false,
    isSaving: false,
    error: null,
    saveSettings: vi.fn(),
    updateSettings: vi.fn(),
  };
  const photosState = {
    photos: [],
    isLoading: false,
    error: null,
    savePhoto: vi.fn(),
    deletePhoto: vi.fn(),
    canAddMore: true,
    photoCount: 0,
  };
  return { settingsState, photosState };
});

vi.mock('@/hooks/useSettings', () => ({ useSettings: () => mocks.settingsState }));
vi.mock('@/hooks/usePhotos', () => ({ usePhotos: () => mocks.photosState }));

import { SettingsPage } from '@/options/components/SettingsPage';

describe('SettingsPage', () => {
  it('同時顯示模型設定與個人照片兩個區塊', () => {
    render(<SettingsPage />);

    expect(screen.getByText('模型設定')).toBeInTheDocument();
    expect(screen.getByText('個人照片')).toBeInTheDocument();
  });
});
