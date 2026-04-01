// store/wrap-store.ts — Wrap Session State
// Manages the multi-step wrap ritual flow.

import { create } from 'zustand';
import { wrapService, type WrapSession } from '@/service/wrap-service';
import type { AtomItem } from '@/types/item';

interface WrapState {
  session: WrapSession | null;
  step: number;
  loading: boolean;

  startWrap: () => Promise<void>;
  updateSession: (partial: Partial<WrapSession>) => void;
  setStep: (step: number) => void;
  commitWrap: (userId: string) => Promise<AtomItem>;
  reset: () => void;
}

const EMPTY_AUDIT = { inbox_count: 0, below_floor: [], orphans: [], stale_count: 0 };
const EMPTY_SOUL = { aurora: null, intention: null, tasks: [], crepusculo: null, shift: null };

export const useWrapStore = create<WrapState>((set, get) => ({
  session: null,
  step: 0,
  loading: false,

  startWrap: async () => {
    set({ loading: true });
    try {
      const data = await wrapService.collectWrapData();
      set({
        session: {
          created: data.created ?? [],
          modified: data.modified ?? [],
          decided: [],
          connections: [],
          seeds: [],
          soul: EMPTY_SOUL,
          audit: data.audit ?? EMPTY_AUDIT,
          next: [],
        },
        step: 0,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  updateSession: (partial) =>
    set((s) => ({
      session: s.session ? { ...s.session, ...partial } : null,
    })),

  setStep: (step) => set({ step }),

  commitWrap: async (userId: string) => {
    const { session } = get();
    if (!session) throw new Error('Nenhuma sessao ativa');
    set({ loading: true });
    try {
      const wrap = await wrapService.commitWrap(session, userId);
      set({ loading: false });
      return wrap;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  reset: () => set({ session: null, step: 0, loading: false }),
}));
