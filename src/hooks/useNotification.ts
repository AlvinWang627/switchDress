import { useCallback } from 'react';
import { notificationService } from '@/services/notificationService';

interface UseNotificationReturn {
  showSynthesisComplete: () => void;
  showError: (message: string) => void;
}

export function useNotification(): UseNotificationReturn {
  const showSynthesisComplete = useCallback(() => {
    notificationService.showSynthesisComplete();
  }, []);

  const showError = useCallback((message: string) => {
    notificationService.showError(message);
  }, []);

  return {
    showSynthesisComplete,
    showError,
  };
}
