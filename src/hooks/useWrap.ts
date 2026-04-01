// hooks/useWrap.ts — Wrap ritual hook
// Thin wrapper around wrap-store for component consumption.

import { useWrapStore } from '@/store/wrap-store';
import { useAppStore } from '@/store/app-store';
import { useQueryClient } from '@tanstack/react-query';
import type { AtomItem } from '@/types/item';

export function useWrap() {
  const store = useWrapStore();
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const commitWrap = async (): Promise<AtomItem | null> => {
    if (!user) return null;
    const wrap = await store.commitWrap(user.id);
    queryClient.invalidateQueries({ queryKey: ['items'] });
    return wrap;
  };

  return {
    session: store.session,
    step: store.step,
    loading: store.loading,
    startWrap: store.startWrap,
    updateSession: store.updateSession,
    setStep: store.setStep,
    commitWrap,
    reset: store.reset,
  };
}
