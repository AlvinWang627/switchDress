type ChromeStorageArea = chrome.storage.LocalStorageArea;

let chromeStoragePromise: Promise<ChromeStorageArea> | null = null;

export function getChromeStorage(): Promise<ChromeStorageArea> {
  if (!chromeStoragePromise) {
    chromeStoragePromise = new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        resolve(chrome.storage.local);
      } else {
        const mockStorage: ChromeStorageArea = {
          get: async () => ({}),
          set: async () => {},
          remove: async () => {},
          clear: async () => {},
          getBytesInUse: async () => 0,
        } as unknown as ChromeStorageArea;
        resolve(mockStorage);
      }
    });
  }
  return chromeStoragePromise;
}
