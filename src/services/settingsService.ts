import { getChromeStorage } from './chromeStorage';
import type { UserSettings } from '@/types';
import type { ProviderId } from '@/types/provider';

const SETTINGS_KEY = 'user-settings';
const PROVIDER_IDS: ProviderId[] = ['gemini', 'openrouter'];

export async function saveSettings(settings: UserSettings): Promise<void> {
  const storage = await getChromeStorage();
  await storage.set({ [SETTINGS_KEY]: settings });
}

/**
 * 將儲存的資料整理成目前的 UserSettings 形狀。
 * 舊版只有單一 `apiKey`（當時僅支援 Gemini），遷移為 `apiKeys.gemini`。
 */
function normalizeSettings(raw: unknown): UserSettings | null {
  if (!raw || typeof raw !== 'object') return null;

  const { model, apiKey, apiKeys } = raw as {
    model?: unknown;
    apiKey?: unknown;
    apiKeys?: unknown;
  };

  const keys: UserSettings['apiKeys'] = {};
  if (apiKeys && typeof apiKeys === 'object') {
    for (const id of PROVIDER_IDS) {
      const value = (apiKeys as Record<string, unknown>)[id];
      if (typeof value === 'string') keys[id] = value;
    }
  }
  if (typeof apiKey === 'string' && apiKey && keys.gemini === undefined) {
    keys.gemini = apiKey;
  }

  return { model: typeof model === 'string' ? model : '', apiKeys: keys };
}

export async function loadSettings(): Promise<UserSettings | null> {
  const storage = await getChromeStorage();
  const result = await storage.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY]);
}
