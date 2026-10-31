import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const useSettingsMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useSettings', () => ({ useSettings: useSettingsMock }));

import { SettingsSection } from '@/options/components/SettingsSection';

const hookState = (overrides: Record<string, unknown> = {}) => ({
  settings: { model: 'gemini-3.1-flash-image-preview', apiKey: '' },
  isLoading: false,
  isSaving: false,
  error: null,
  saveSettings: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn(),
  ...overrides,
});

const saveButton = () => screen.getByRole('button', { name: /儲存/ });

describe('SettingsSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('載入中顯示骨架畫面，不顯示表單', () => {
    useSettingsMock.mockReturnValue(hookState({ isLoading: true }));
    render(<SettingsSection />);

    expect(screen.queryByText('模型設定')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument();
  });

  it('以已儲存的設定初始化表單', () => {
    useSettingsMock.mockReturnValue(hookState({ settings: { model: 'gemini-3.1-flash-image-preview', apiKey: 'saved-key' } }));
    render(<SettingsSection />);

    expect(screen.getByText('模型設定')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toHaveValue('saved-key');
    expect(screen.getByLabelText('模型')).toHaveValue('gemini-3.1-flash-image-preview');
  });

  describe('儲存按鈕狀態', () => {
    it('API Key 為空時停用', () => {
      useSettingsMock.mockReturnValue(hookState());
      render(<SettingsSection />);
      expect(saveButton()).toBeDisabled();
    });

    it('API Key 只有空白時停用', () => {
      useSettingsMock.mockReturnValue(hookState());
      render(<SettingsSection />);

      fireEvent.change(screen.getByLabelText('API Key'), { target: { value: '   ' } });

      expect(saveButton()).toBeDisabled();
    });

    it('輸入 API Key 後啟用', () => {
      useSettingsMock.mockReturnValue(hookState());
      render(<SettingsSection />);

      fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'abc' } });

      expect(saveButton()).toBeEnabled();
    });

    it('儲存中顯示「儲存中...」並停用所有欄位', () => {
      useSettingsMock.mockReturnValue(
        hookState({ isSaving: true, settings: { model: 'gemini-3.1-flash-image-preview', apiKey: 'abc' } })
      );
      render(<SettingsSection />);

      expect(screen.getByText('儲存中...')).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
      expect(screen.getByLabelText('API Key')).toBeDisabled();
      expect(screen.getByLabelText('模型')).toBeDisabled();
    });
  });

  describe('儲存', () => {
    it('成功：以表單內容呼叫 saveSettings、顯示提示、呼叫 onSaveSuccess', async () => {
      const state = hookState();
      useSettingsMock.mockReturnValue(state);
      const onSaveSuccess = vi.fn();
      render(<SettingsSection onSaveSuccess={onSaveSuccess} />);

      fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'my-key' } });
      fireEvent.click(saveButton());

      expect(await screen.findByText('設定已儲存')).toBeInTheDocument();
      expect(state.saveSettings).toHaveBeenCalledWith({ model: 'gemini-3.1-flash-image-preview', apiKey: 'my-key' });
      expect(onSaveSuccess).toHaveBeenCalled();
    });

    it('失敗：顯示錯誤提示並呼叫 onSaveError', async () => {
      const state = hookState({
        settings: { model: 'gemini-3.1-flash-image-preview', apiKey: 'k' },
        saveSettings: vi.fn().mockRejectedValue(new Error('disk full')),
      });
      useSettingsMock.mockReturnValue(state);
      const onSaveError = vi.fn();
      render(<SettingsSection onSaveError={onSaveError} />);

      fireEvent.click(saveButton());

      expect(await screen.findByText('儲存失敗，請重試')).toBeInTheDocument();
      expect(onSaveError).toHaveBeenCalledWith(expect.objectContaining({ message: 'disk full' }));
    });

    it('失敗且不是 Error 時以預設錯誤回報', async () => {
      useSettingsMock.mockReturnValue(
        hookState({
          settings: { model: 'gemini-3.1-flash-image-preview', apiKey: 'k' },
          saveSettings: vi.fn().mockRejectedValue('x'),
        })
      );
      const onSaveError = vi.fn();
      render(<SettingsSection onSaveError={onSaveError} />);

      fireEvent.click(saveButton());
      await screen.findByText('儲存失敗，請重試');

      expect(onSaveError).toHaveBeenCalledWith(expect.objectContaining({ message: '儲存失敗' }));
    });

    it('提示在 3 秒後消失', async () => {
      useSettingsMock.mockReturnValue(hookState({ settings: { model: 'gemini-3.1-flash-image-preview', apiKey: 'k' } }));
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      render(<SettingsSection />);

      fireEvent.click(saveButton());
      await screen.findByText('設定已儲存');

      const hide = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 3000)?.[0] as () => void;
      expect(hide).toBeTypeOf('function');
      act(() => hide());

      expect(screen.queryByText('設定已儲存')).not.toBeInTheDocument();
    });
  });

  it('settings 更新時同步到表單', () => {
    useSettingsMock.mockReturnValue(hookState());
    const { rerender } = render(<SettingsSection />);

    useSettingsMock.mockReturnValue(hookState({ settings: { model: 'gemini-3.1-flash-image-preview', apiKey: 'loaded-later' } }));
    rerender(<SettingsSection />);

    expect(screen.getByLabelText('API Key')).toHaveValue('loaded-later');
  });
});
