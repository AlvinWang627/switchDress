const NOTIFICATION_IDS = {
  SYNTHESIS_COMPLETE: 'synthesis-complete',
  SYNTHESIS_ERROR: 'synthesis-error',
} as const;

export function showSynthesisComplete(): void {
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create(NOTIFICATION_IDS.SYNTHESIS_COMPLETE, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
      title: 'AI 合成完成',
      message: '虛擬試穿結果已存入相片集',
      priority: 0,
    });
  }
}

export function showError(message: string): void {
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create(NOTIFICATION_IDS.SYNTHESIS_ERROR, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
      title: 'AI 合成失敗',
      message: message,
      priority: 1,
    });
  }
}

export const notificationService = {
  showSynthesisComplete,
  showError,
};
