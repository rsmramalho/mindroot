// store/offline-store.ts — Online/offline state + pending queue count
import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  setOnline: (v: boolean) => void;
  setPendingCount: (n: number) => void;
  setSyncing: (v: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  isSyncing: false,
  setOnline: (v) => set({ isOnline: v }),
  setPendingCount: (n) => set({ pendingCount: n }),
  setSyncing: (v) => set({ isSyncing: v }),
}));
