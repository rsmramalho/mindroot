// store/triage-store.ts — Triage queue state
import { create } from 'zustand';
import { triageService, type TriagedItem } from '@/service/triage-service';
import type { AtomType } from '@/config/types';
import type { TriageResult } from '@/service/ai-service';

interface TriageState {
  queue: TriagedItem[];
  autoProcessed: number;
  loading: boolean;
  error: string | null;
  runTriage: (userId: string) => Promise<void>;
  confirmItem: (itemId: string, result: TriageResult) => Promise<void>;
  overrideItem: (itemId: string, type: AtomType, module: string) => Promise<void>;
  skipItem: (itemId: string) => void;
  clearQueue: () => void;
}

export const useTriageStore = create<TriageState>((set) => ({
  queue: [],
  autoProcessed: 0,
  loading: false,
  error: null,

  runTriage: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const results = await triageService.triageInbox(userId);
      const autoCount = results.filter(r => r.processed).length;
      const pending = results.filter(r => !r.processed);
      set({ queue: pending, autoProcessed: autoCount, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  confirmItem: async (itemId, result) => {
    try {
      await triageService.confirmSuggestion(itemId, result);
      set(s => ({ queue: s.queue.filter(q => q.item.id !== itemId) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  overrideItem: async (itemId, type, module) => {
    try {
      await triageService.overrideSuggestion(itemId, type, module);
      set(s => ({ queue: s.queue.filter(q => q.item.id !== itemId) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  skipItem: (itemId) => {
    set(s => ({ queue: s.queue.filter(q => q.item.id !== itemId) }));
  },

  clearQueue: () => set({ queue: [], autoProcessed: 0 }),
}));
