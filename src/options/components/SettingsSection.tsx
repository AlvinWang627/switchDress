import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ProviderSelector } from './ProviderSelector';
import { ModelSelector } from './ModelSelector';
import { ApiKeyInput } from './ApiKeyInput';
import { useSettings } from '@/hooks/useSettings';
import {
  DEFAULT_MODEL,
  IMAGE_PROVIDERS,
  getProvider,
  getProviderForModel,
} from '@/services/imageProviders';
import type { UserSettings } from '@/types';
import type { ProviderId } from '@/types/provider';

interface SettingsSectionProps {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function SettingsSection({ onSaveSuccess, onSaveError }: SettingsSectionProps) {
  const { settings, isLoading, isSaving, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>({
    model: DEFAULT_MODEL,
    apiKeys: {},
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // 供應商由所選模型決定；API Key 則依供應商各自保存
  const provider = getProviderForModel(localSettings.model);
  const apiKey = localSettings.apiKeys[provider.id] ?? '';

  const handleProviderChange = (id: ProviderId) => {
    // 切換供應商時改選該供應商的第一個模型，各供應商的 API Key 保持不變
    setLocalSettings((prev) => ({ ...prev, model: getProvider(id).models[0].value }));
  };

  const handleApiKeyChange = (value: string) => {
    setLocalSettings((prev) => ({ ...prev, apiKeys: { ...prev.apiKeys, [provider.id]: value } }));
  };

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
        <ProviderSelector
          value={provider.id}
          onChange={handleProviderChange}
          providers={IMAGE_PROVIDERS}
          disabled={isSaving}
        />

        <ModelSelector
          value={localSettings.model}
          onChange={(model) => setLocalSettings((prev) => ({ ...prev, model }))}
          models={provider.models}
          disabled={isSaving}
        />

        <ApiKeyInput
          value={apiKey}
          onChange={handleApiKeyChange}
          hint={provider.keyHint}
          disabled={isSaving}
        />

        <button
          onClick={handleSave}
          disabled={isSaving || !apiKey.trim()}
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
