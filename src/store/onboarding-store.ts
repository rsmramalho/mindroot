// store/onboarding-store.ts — Persisted flags for onboarding + first-use hints
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  // Welcome flow completed
  onboardingDone: boolean;
  setOnboardingDone: () => void;

  // AtomInput tooltip shown once
  inputTooltipShown: boolean;
  setInputTooltipShown: () => void;

  // Reset (for testing)
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingDone: false,
      setOnboardingDone: () => set({ onboardingDone: true }),

      inputTooltipShown: false,
      setInputTooltipShown: () => set({ inputTooltipShown: true }),

      resetOnboarding: () =>
        set({ onboardingDone: false, inputTooltipShown: false }),
    }),
    {
      name: 'mindroot-onboarding',
    }
  )
);
