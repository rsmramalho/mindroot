// store/ritual-store.ts — Zustand ritual + period state
import { create } from 'zustand';
import type { RitualSlot } from '@/types/item';
import { getCurrentPeriod } from '@/types/ui';

interface RitualState {
  currentPeriod: RitualSlot;
  periodGreeting: string;
  periodColor: string;
  isCheckInOpen: boolean;
  reflectionText: string;

  refreshPeriod: () => void;
  openCheckIn: () => void;
  closeCheckIn: () => void;
  setReflection: (text: string) => void;
}

export const useRitualStore = create<RitualState>((set) => {
  const period = getCurrentPeriod();
  return {
    currentPeriod: period.key,
    periodGreeting: period.greeting,
    periodColor: period.color,
    isCheckInOpen: false,
    reflectionText: '',

    refreshPeriod: () => {
      const p = getCurrentPeriod();
      set({
        currentPeriod: p.key,
        periodGreeting: p.greeting,
        periodColor: p.color,
      });
    },

    openCheckIn: () => set({ isCheckInOpen: true }),
    closeCheckIn: () => set({ isCheckInOpen: false, reflectionText: '' }),
    setReflection: (text) => set({ reflectionText: text }),
  };
});
