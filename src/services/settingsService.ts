import { getChromeStorage } from './chromeStorage';
import type { UserSettings } from '@/types';

const SETTINGS_KEY = 'user-settings';

export async function saveSettings(settings: UserSettings): Promise<void> {
  const storage = await getChromeStorage();
  await storage.set({ [SETTINGS_KEY]: settings });
}

export async function loadSettings(): Promise<UserSettings | null> {
  const storage = await getChromeStorage();
  const result = await storage.get(SETTINGS_KEY);
  return (result[SETTINGS_KEY] as UserSettings) ?? null;
}
