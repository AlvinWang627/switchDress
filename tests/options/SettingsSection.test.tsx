import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const useSettingsMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useSettings', () => ({ useSettings: useSettingsMock }));

import { SettingsSection } from '@/options/components/SettingsSection';

const hookState = (overrides: Record<string, unknown> = {}) => ({
  settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: '' } },
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
    useSettingsMock.mockReturnValue(
      hookState({
        settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'saved-key' } },
      })
    );
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
        hookState({
          isSaving: true,
          settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'abc' } },
        })
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
      expect(state.saveSettings).toHaveBeenCalledWith({
        model: 'gemini-3.1-flash-image-preview',
        apiKeys: { gemini: 'my-key' },
      });
      expect(onSaveSuccess).toHaveBeenCalled();
    });

    it('失敗：顯示錯誤提示並呼叫 onSaveError', async () => {
      const state = hookState({
        settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'k' } },
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
          settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'k' } },
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
      useSettingsMock.mockReturnValue(
        hookState({
          settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'k' } },
        })
      );
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

    useSettingsMock.mockReturnValue(
      hookState({
        settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'loaded-later' } },
      })
    );
    rerender(<SettingsSection />);

    expect(screen.getByLabelText('API Key')).toHaveValue('loaded-later');
  });

  describe('供應商', () => {
    it('依已儲存的模型推得供應商', () => {
      useSettingsMock.mockReturnValue(
        hookState({
          settings: { model: 'qwen/qwen-image-2.1-pro', apiKeys: { openrouter: 'or-key' } },
        })
      );
      render(<SettingsSection />);

      expect(screen.getByLabelText('供應商')).toHaveValue('openrouter');
      expect(screen.getByLabelText('模型')).toHaveValue('qwen/qwen-image-2.1-pro');
      expect(screen.getByLabelText('API Key')).toHaveValue('or-key');
      expect(screen.getByText(/經由 OpenRouter 轉送/)).toBeInTheDocument();
    });

    it('切換供應商：改選該供應商第一個模型，並顯示該供應商自己的 Key', () => {
      useSettingsMock.mockReturnValue(
        hookState({
          settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'g-key' } },
        })
      );
      render(<SettingsSection />);

      fireEvent.change(screen.getByLabelText('供應商'), { target: { value: 'openrouter' } });

      expect(screen.getByLabelText('模型')).toHaveValue('qwen/qwen-image-2.1-pro');
      expect(screen.getByLabelText('API Key')).toHaveValue('');
      expect(saveButton()).toBeDisabled();
    });

    it('各供應商的 Key 分開保存，儲存時一併送出', async () => {
      const state = hookState({
        settings: { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'g-key' } },
      });
      useSettingsMock.mockReturnValue(state);
      render(<SettingsSection />);

      fireEvent.change(screen.getByLabelText('供應商'), { target: { value: 'openrouter' } });
      fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'or-key' } });
      fireEvent.change(screen.getByLabelText('模型'), { target: { value: 'qwen/qwen-image-3' } });
      fireEvent.click(saveButton());

      await screen.findByText('設定已儲存');
      expect(state.saveSettings).toHaveBeenCalledWith({
        model: 'qwen/qwen-image-3',
        apiKeys: { gemini: 'g-key', openrouter: 'or-key' },
      });

      // 切回 Gemini 時仍是原本的 Key
      fireEvent.change(screen.getByLabelText('供應商'), { target: { value: 'gemini' } });
      expect(screen.getByLabelText('API Key')).toHaveValue('g-key');
    });
  });
});
