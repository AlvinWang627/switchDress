import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installChromeMock, uninstallChromeMock } from '../helpers/chrome';
import { showSynthesisComplete, showError, notificationService } from '@/services/notificationService';

describe('notificationService', () => {
  let create: ReturnType<typeof vi.fn>;

  const withNotifications = () => {
    const { chrome } = installChromeMock();
    create = vi.fn();
    Object.assign(chrome, { notifications: { create } });
    Object.assign(chrome.runtime, { getURL: vi.fn((p: string) => `chrome-extension://ext/${p}`) });
    return chrome;
  };

  afterEach(() => {
    uninstallChromeMock();
  });

  describe('有 chrome.notifications', () => {
    beforeEach(() => {
      withNotifications();
    });

    it('showSynthesisComplete 建立低優先權的完成通知', () => {
      showSynthesisComplete();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith('synthesis-complete', {
        type: 'basic',
        iconUrl: 'chrome-extension://ext/icons/icon-48.png',
        title: 'AI 合成完成',
        message: '虛擬試穿結果已存入相片集',
        priority: 0,
      });
    });

    it('showError 建立帶有錯誤訊息的高優先權通知', () => {
      showError('額度已用完');

      expect(create).toHaveBeenCalledWith('synthesis-error', {
        type: 'basic',
        iconUrl: 'chrome-extension://ext/icons/icon-48.png',
        title: 'AI 合成失敗',
        message: '額度已用完',
        priority: 1,
      });
    });

    it('notificationService 物件暴露兩個函式', () => {
      expect(notificationService.showSynthesisComplete).toBe(showSynthesisComplete);
      expect(notificationService.showError).toBe(showError);
    });
  });

  describe('沒有 notifications API 時', () => {
    it('沒有 chrome 全域物件：不拋出例外', () => {
      uninstallChromeMock();
      expect(() => showSynthesisComplete()).not.toThrow();
      expect(() => showError('x')).not.toThrow();
    });

    it('chrome 存在但缺少 notifications 權限：不呼叫、不拋出例外', () => {
      const { chrome } = installChromeMock();
      const getURL = vi.fn();
      Object.assign(chrome.runtime, { getURL });

      expect(() => showSynthesisComplete()).not.toThrow();
      expect(() => showError('x')).not.toThrow();
      expect(getURL).not.toHaveBeenCalled();
    });
  });
});
