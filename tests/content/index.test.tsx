import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { installChromeMock, uninstallChromeMock, type MessageListener } from '../helpers/chrome';
import { MESSAGE_TYPES } from '@/types/message';

// 真正的 overlay 已另有測試；這裡以簡化版取代，只負責暴露 onConfirm / onCancel
vi.mock('@/components/ScreenshotOverlay/ScreenshotOverlay', async () => {
  const React = await import('react');
  return {
    default: ({
      imageUrl,
      onConfirm,
      onCancel,
    }: {
      imageUrl: string;
      onConfirm: (s: unknown, b: Blob) => void;
      onCancel: () => void;
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'overlay', 'data-image': imageUrl },
        React.createElement('button', {
          'data-testid': 'confirm',
          onClick: () => onConfirm({ x: 0, y: 0, width: 1, height: 1 }, new Blob(['crop'], { type: 'image/png' })),
        }),
        React.createElement('button', { 'data-testid': 'cancel', onClick: onCancel })
      ),
  };
});
vi.mock('@/style/index.css?inline', () => ({ default: '.mock{}' }));

const HOST_ID = 'switchdress-screenshot-overlay';

describe('content script', () => {
  let chromeMock: ReturnType<typeof installChromeMock>['chrome'];
  let data: Record<string, unknown>;
  let listener: MessageListener;
  let alertSpy: ReturnType<typeof vi.fn>;

  const host = () => document.getElementById(HOST_ID);
  const overlayIn = (el: HTMLElement) => el.shadowRoot!.querySelector('[data-testid="overlay"]') as HTMLElement | null;

  /** 送出 START_OVERLAY 並讓 CAPTURE_TAB 回覆 */
  const startOverlay = async (reply: unknown = { success: true, dataUrl: 'data:image/png;base64,AAA' }) => {
    chromeMock.runtime.sendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) => cb(reply));
    const sendResponse = vi.fn();
    await act(async () => {
      listener({ type: MESSAGE_TYPES.START_OVERLAY }, {}, sendResponse);
    });
    return sendResponse;
  };

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const installed = installChromeMock();
    chromeMock = installed.chrome;
    data = installed.data;
    await import('@/content/index');
    listener = installed.listeners[0];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    uninstallChromeMock();
  });

  it('載入時註冊 onMessage listener', () => {
    expect(chromeMock.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  it('收到 START_OVERLAY 時立即回覆成功，避免 popup 端出現 lastError', async () => {
    const sendResponse = await startOverlay();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('向 background 要求 CAPTURE_TAB 截圖', async () => {
    await startOverlay();
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith(
      { type: MESSAGE_TYPES.CAPTURE_TAB },
      expect.any(Function)
    );
  });

  it('截圖成功後把 overlay 掛到最上層的 Shadow DOM，並注入樣式', async () => {
    await startOverlay();

    const el = host()!;
    expect(el).toBeTruthy();
    expect(el.style.position).toBe('fixed');
    expect(el.style.zIndex).toBe('2147483647');
    expect(el.shadowRoot!.querySelector('style')?.textContent).toBe('.mock{}');
    expect(overlayIn(el)).toHaveAttribute('data-image', 'data:image/png;base64,AAA');
  });

  it('overlay 已開啟時再次觸發不會重複掛載', async () => {
    await startOverlay();
    await startOverlay();

    expect(document.querySelectorAll(`#${HOST_ID}`)).toHaveLength(1);
  });

  it.each([
    ['success 為 false', { success: false, error: { message: 'x' } }],
    ['沒有 dataUrl', { success: true }],
    ['沒有回應', null],
  ])('截圖失敗（%s）時提示使用者且不掛載', async (_label, reply) => {
    await startOverlay(reply);

    expect(alertSpy).toHaveBeenCalledWith('無法取得網頁截圖');
    expect(host()).toBeNull();
  });

  it('取消：移除 overlay，之後可重新開啟', async () => {
    await startOverlay();
    const cancel = overlayIn(host()!)!.querySelector('[data-testid="cancel"]') as HTMLElement;

    await act(async () => cancel.click());

    expect(host()).toBeNull();

    await startOverlay();
    expect(host()).not.toBeNull();
  });

  it('確認：把裁切結果以 base64 存入 draftScreenshot、提示、並移除 overlay', async () => {
    await startOverlay();
    const confirm = overlayIn(host()!)!.querySelector('[data-testid="confirm"]') as HTMLElement;

    await act(async () => {
      confirm.click();
      // FileReader 為非同步，等待它完成
      await vi.waitFor(() => expect(data.draftScreenshot).toBeDefined());
    });

    expect(String(data.draftScreenshot)).toMatch(/^data:image\/png;base64,/);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('截圖已儲存'));
    expect(host()).toBeNull();
  });

  it('忽略其他類型的訊息，但仍回傳 true', () => {
    const sendResponse = vi.fn();

    const returned = listener({ type: MESSAGE_TYPES.GET_IMAGES }, {}, sendResponse);

    expect(returned).toBe(true);
    expect(sendResponse).not.toHaveBeenCalled();
    expect(chromeMock.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
