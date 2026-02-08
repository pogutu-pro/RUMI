import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useUiStore } from './ui.store';

/**
 * @deprecated Migration in progress. 
 * Use useAuthStore() or useUiStore() directly for better performance and slice-less architecture.
 */
export const useAppStore: any = (selector: any) => {
  // This is a bridge to prevent immediate breakages.
  // It combines both stores but loses atomic performance benefits.
  const authState = useAuthStore();
  const uiState = useUiStore();
  const merged = { ...authState, ...uiState };
  return selector ? selector(merged) : merged;
};

// Forward getState/subscribe to auth store as a fallback for action-only calls
Object.assign(useAppStore, {
  getState: () => ({ ...useAuthStore.getState(), ...useUiStore.getState() }),
  subscribe: (listener: any) => {
    const unsubAuth = useAuthStore.subscribe(listener);
    const unsubUi = useUiStore.subscribe(listener);
    return () => {
      unsubAuth();
      unsubUi();
    };
  }
});
