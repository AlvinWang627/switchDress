import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const settingsServiceMock = vi.hoisted(() => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
}));
vi.mock('@/services/settingsService', () => settingsServiceMock);

import { useSettings } from '@/hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    settingsServiceMock.loadSettings.mockReset().mockResolvedValue(null);
    settingsServiceMock.saveSettings.mockReset().mockResolvedValue(undefined);
  });

  it('載入中先顯示預設值，完成後 isLoading 為 false', async () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.settings).toEqual({ model: 'nano-banana2', apiKey: '' });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings).toEqual({ model: 'nano-banana2', apiKey: '' });
  });

  it('有已儲存設定時載入它', async () => {
    settingsServiceMock.loadSettings.mockResolvedValue({ model: 'm', apiKey: 'k' });

    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toEqual({ model: 'm', apiKey: 'k' });
  });

  it('載入失敗時設定 error', async () => {
    settingsServiceMock.loadSettings.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('boom');
  });

  it('載入失敗且拋出非 Error 時使用預設訊息', async () => {
    settingsServiceMock.loadSettings.mockRejectedValue('x');

    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('載入設定失敗');
  });

  it('updateSettings 只合併部分欄位，不寫入儲存', async () => {
    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.updateSettings({ apiKey: 'new' }));

    expect(result.current.settings).toEqual({ model: 'nano-banana2', apiKey: 'new' });
    expect(settingsServiceMock.saveSettings).not.toHaveBeenCalled();
  });

  it('saveSettings 成功後更新 settings 並結束 isSaving', async () => {
    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.saveSettings({ model: 'm', apiKey: 'k' }));

    expect(settingsServiceMock.saveSettings).toHaveBeenCalledWith({ model: 'm', apiKey: 'k' });
    expect(result.current.settings).toEqual({ model: 'm', apiKey: 'k' });
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('saveSettings 失敗時設定 error、重新拋出，且不改變 settings', async () => {
    settingsServiceMock.saveSettings.mockRejectedValue(new Error('disk full'));
    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveSettings({ model: 'm', apiKey: 'k' })).rejects.toThrow('disk full');
    });

    expect(result.current.error?.message).toBe('disk full');
    expect(result.current.isSaving).toBe(false);
    expect(result.current.settings).toEqual({ model: 'nano-banana2', apiKey: '' });
  });
});
