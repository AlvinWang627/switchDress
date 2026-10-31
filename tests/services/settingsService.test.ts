import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';

describe('settingsService', () => {
  beforeEach(() => {
    // chromeStorage 會快取 storage，每個測試需重新載入模組
    vi.resetModules();
  });
  afterEach(uninstallChromeMock);

  it('尚未儲存時 loadSettings 回傳 null', async () => {
    installChromeMock();
    const { loadSettings } = await import('@/services/settingsService');
    expect(await loadSettings()).toBeNull();
  });

  it('saveSettings 寫入 user-settings，loadSettings 可讀回', async () => {
    const { data } = installChromeMock();
    const { saveSettings, loadSettings } = await import('@/services/settingsService');
    const settings = { model: 'nano-banana2', apiKey: 'secret' };

    await saveSettings(settings);

    expect(data['user-settings']).toEqual(settings);
    expect(await loadSettings()).toEqual(settings);
  });

  it('重複儲存會覆蓋舊值', async () => {
    installChromeMock();
    const { saveSettings, loadSettings } = await import('@/services/settingsService');
    await saveSettings({ model: 'a', apiKey: '1' });
    await saveSettings({ model: 'b', apiKey: '2' });
    expect(await loadSettings()).toEqual({ model: 'b', apiKey: '2' });
  });
});

describe('getChromeStorage', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(uninstallChromeMock);

  it('有 chrome.storage.local 時回傳它', async () => {
    const { chrome } = installChromeMock();
    const { getChromeStorage } = await import('@/services/chromeStorage');
    expect(await getChromeStorage()).toBe(chrome.storage.local);
  });

  it('重複呼叫回傳同一個實例（快取）', async () => {
    installChromeMock();
    const { getChromeStorage } = await import('@/services/chromeStorage');
    expect(await getChromeStorage()).toBe(await getChromeStorage());
  });

  it('非擴充環境時退回 mock storage（寫入不保留）', async () => {
    uninstallChromeMock();
    const { getChromeStorage } = await import('@/services/chromeStorage');
    const storage = await getChromeStorage();
    await storage.set({ a: 1 });
    expect(await storage.get('a')).toEqual({});
    expect(await storage.getBytesInUse()).toBe(0);
  });
});
