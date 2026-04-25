import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ModelSelector } from './ModelSelector';
import { ApiKeyInput } from './ApiKeyInput';
import { useSettings } from '@/hooks/useSettings';
import type { UserSettings } from '@/types';

interface SettingsSectionProps {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function SettingsSection({ onSaveSuccess, onSaveError }: SettingsSectionProps) {
  const { settings, isLoading, isSaving, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>({
    model: 'nano-banana2',
    apiKey: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings(localSettings);
      setToastMessage('設定已儲存');
      setToastType('success');
      setShowToast(true);
      onSaveSuccess?.();
    } catch (err) {
      setToastMessage('儲存失敗，請重試');
      setToastType('error');
      setShowToast(true);
      onSaveError?.(err instanceof Error ? err : new Error('儲存失敗'));
    }

    setTimeout(() => setShowToast(false), 3000);
  };

  if (isLoading) {
    return (
      <section className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">模型設定</h2>

      <div className="space-y-4">
        <ModelSelector
          value={localSettings.model}
          onChange={(model) => setLocalSettings((prev) => ({ ...prev, model }))}
          disabled={isSaving}
        />

        <ApiKeyInput
          value={localSettings.apiKey}
          onChange={(apiKey) => setLocalSettings((prev) => ({ ...prev, apiKey }))}
          disabled={isSaving}
        />

        <button
          onClick={handleSave}
          disabled={isSaving || !localSettings.apiKey.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
              儲存中...
            </>
          ) : (
            <>
              <Icon icon="mdi:content-save" className="w-5 h-5" />
              儲存模型
            </>
          )}
        </button>
      </div>

      {showToast && (
        <div
          className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}
        >
          <Icon
            icon={toastType === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'}
            className="w-5 h-5"
          />
          {toastMessage}
        </div>
      )}
    </section>
  );
}
