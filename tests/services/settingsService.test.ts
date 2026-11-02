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
    const settings = { model: 'gemini-3.1-flash-image-preview', apiKeys: { gemini: 'secret' } };

    await saveSettings(settings);

    expect(data['user-settings']).toEqual(settings);
    expect(await loadSettings()).toEqual(settings);
  });

  it('重複儲存會覆蓋舊值', async () => {
    installChromeMock();
    const { saveSettings, loadSettings } = await import('@/services/settingsService');
    await saveSettings({ model: 'a', apiKeys: { gemini: '1' } });
    await saveSettings({ model: 'b', apiKeys: { gemini: '2' } });
    expect(await loadSettings()).toEqual({ model: 'b', apiKeys: { gemini: '2' } });
  });

  describe('舊版資料遷移', () => {
    it('舊版單一 apiKey 視為 Gemini 的 Key', async () => {
      const { data } = installChromeMock();
      data['user-settings'] = { model: 'gemini-2.5-flash-image', apiKey: 'legacy' };
      const { loadSettings } = await import('@/services/settingsService');

      expect(await loadSettings()).toEqual({
        model: 'gemini-2.5-flash-image',
        apiKeys: { gemini: 'legacy' },
      });
    });

    it('已有 apiKeys.gemini 時不被舊 apiKey 覆蓋', async () => {
      const { data } = installChromeMock();
      data['user-settings'] = {
        model: 'm',
        apiKey: 'old',
        apiKeys: { gemini: 'new', openrouter: 'or' },
      };
      const { loadSettings } = await import('@/services/settingsService');

      expect(await loadSettings()).toEqual({
        model: 'm',
        apiKeys: { gemini: 'new', openrouter: 'or' },
      });
    });

    it('忽略未知供應商與非字串值，缺少 model 時給空字串', async () => {
      const { data } = installChromeMock();
      data['user-settings'] = { apiKeys: { gemini: 1, openrouter: 'or', other: 'x' } };
      const { loadSettings } = await import('@/services/settingsService');

      expect(await loadSettings()).toEqual({ model: '', apiKeys: { openrouter: 'or' } });
    });

    it('儲存值不是物件時回傳 null', async () => {
      const { data } = installChromeMock();
      data['user-settings'] = 'garbage';
      const { loadSettings } = await import('@/services/settingsService');

      expect(await loadSettings()).toBeNull();
    });
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
