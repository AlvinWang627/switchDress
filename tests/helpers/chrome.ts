import { vi } from 'vitest';

type StorageData = Record<string, unknown>;

export type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | void;

/**
 * 建立帶有記憶體儲存的 chrome API mock，並掛到 globalThis.chrome。
 * storage.local 同時支援 callback 與 Promise 兩種呼叫方式（與真實 API 一致）。
 */
export function installChromeMock(initial: StorageData = {}) {
  const data: StorageData = { ...initial };
  const listeners: MessageListener[] = [];

  const pick = (keys?: string | string[] | null): StorageData => {
    if (keys == null) return { ...data };
    const list = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, data[k]]));
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
      Object.assign(data, items);
      if (cb) {
        cb();
        return undefined;
      }
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[], cb?: () => void) => {
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete data[k]);
      if (cb) {
        cb();
        return undefined;
      }
      return Promise.resolve();
    }),
  };

  const chromeMock = {
    storage: { local },
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
  };

  (globalThis as unknown as { chrome: unknown }).chrome = chromeMock;

  return { chrome: chromeMock, data, listeners };
}

export function uninstallChromeMock() {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
}
