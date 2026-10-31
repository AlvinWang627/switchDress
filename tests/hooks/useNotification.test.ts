import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const notificationServiceMock = vi.hoisted(() => ({
  showSynthesisComplete: vi.fn(),
  showError: vi.fn(),
}));
vi.mock('@/services/notificationService', () => ({ notificationService: notificationServiceMock }));

import { useNotification } from '@/hooks/useNotification';

describe('useNotification', () => {
  beforeEach(() => {
    notificationServiceMock.showSynthesisComplete.mockReset();
    notificationServiceMock.showError.mockReset();
  });

  it('showSynthesisComplete 委派給 notificationService', () => {
    const { result } = renderHook(() => useNotification());

    result.current.showSynthesisComplete();

    expect(notificationServiceMock.showSynthesisComplete).toHaveBeenCalledTimes(1);
  });

  it('showError 把訊息傳給 notificationService', () => {
    const { result } = renderHook(() => useNotification());

    result.current.showError('失敗了');

    expect(notificationServiceMock.showError).toHaveBeenCalledWith('失敗了');
  });

  it('重新渲染後函式參照保持穩定（可安全放進 effect 相依）', () => {
    const { result, rerender } = renderHook(() => useNotification());
    const first = result.current;

    rerender();

    expect(result.current.showSynthesisComplete).toBe(first.showSynthesisComplete);
    expect(result.current.showError).toBe(first.showError);
  });
});
