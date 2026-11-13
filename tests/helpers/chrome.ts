import { vi } from 'vitest';

type StorageData = Record<string, unknown>;

export type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | void;

export type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>;

export type StorageChangeListener = (changes: StorageChanges, areaName: string) => void;

/**
 * 建立帶有記憶體儲存的 chrome API mock，並掛到 globalThis.chrome。
 * storage.local 同時支援 callback 與 Promise 兩種呼叫方式（與真實 API 一致）。
 * set / remove 會同步觸發 storage.onChanged；與真實 API 相同，值沒有改變的 key 不會出現在 changes 中。
 */
export function installChromeMock(initial: StorageData = {}) {
  const data: StorageData = { ...initial };
  const listeners: MessageListener[] = [];
  const storageListeners: StorageChangeListener[] = [];

  const pick = (keys?: string | string[] | null): StorageData => {
    if (keys == null) return { ...data };
    const list = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, data[k]]));
  };

  const emitChanges = (changes: StorageChanges) => {
    if (Object.keys(changes).length === 0) return;
    [...storageListeners].forEach((l) => l(changes, 'local'));
  };

  const local = {
    get: vi.fn((keys?: string | string[] | null, cb?: (r: StorageData) => void) => {
      const result = pick(keys);
      if (cb) {
        cb(result);
        return undefined;
      }
      return Promise.resolve(result);
    }),
    set: vi.fn((items: StorageData, cb?: () => void) => {
      const changes: StorageChanges = {};
      Object.entries(items).forEach(([k, v]) => {
        if (data[k] !== v) changes[k] = { oldValue: data[k], newValue: v };
      });
      Object.assign(data, items);
      emitChanges(changes);
      if (cb) {
        cb();
        return undefined;
      }
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[], cb?: () => void) => {
      const changes: StorageChanges = {};
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
        if (k in data) changes[k] = { oldValue: data[k] };
        delete data[k];
      });
      emitChanges(changes);
      if (cb) {
        cb();
        return undefined;
      }
      return Promise.resolve();
    }),
  };

  const onChanged = {
    addListener: vi.fn((l: StorageChangeListener) => {
      storageListeners.push(l);
    }),
    removeListener: vi.fn((l: StorageChangeListener) => {
      const i = storageListeners.indexOf(l);
      if (i > -1) storageListeners.splice(i, 1);
    }),
  };

  const chromeMock = {
    storage: { local, onChanged },
    runtime: {
      lastError: undefined as { message?: string } | undefined,
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn((l: MessageListener) => listeners.push(l)),
      },
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
      captureVisibleTab: vi.fn(),
    },
    windows: {
      getLastFocused: vi.fn(),
    },
    sidePanel: {
      setPanelBehavior: vi.fn(() => Promise.resolve()),
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = chromeMock;

  return { chrome: chromeMock, data, listeners, storageListeners };
}

export function uninstallChromeMock() {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
}
