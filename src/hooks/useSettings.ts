import { useState, useEffect, useCallback } from 'react';
import { saveSettings, loadSettings } from '@/services/settingsService';
import type { UserSettings } from '@/types';

const DEFAULT_SETTINGS: UserSettings = {
  model: 'gemini-3.1-flash-image-preview',
  apiKey: '',
};

interface UseSettingsReturn {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  saveSettings: (settings: UserSettings) => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const saved = await loadSettings();
      if (saved) {
        if (!saved.model) {
          saved.model = 'gemini-3.1-flash-image-preview';
        }
        setSettings(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('載入設定失敗'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      await saveSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('儲存設定失敗'));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings: handleSaveSettings,
    updateSettings,
  };
}
