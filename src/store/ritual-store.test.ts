// store/ritual-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useRitualStore } from './ritual-store';

beforeEach(() => {
  // Reset store state
  useRitualStore.setState({
    isCheckInOpen: false,
    reflectionText: '',
  });
});

describe('RitualStore — Period', () => {
  it('initializes with a valid period', () => {
    const state = useRitualStore.getState();
    expect(['aurora', 'zenite', 'crepusculo']).toContain(state.currentPeriod);
    expect(state.periodGreeting).toBeTruthy();
    expect(state.periodColor).toMatch(/^#/);
  });

  it('refreshPeriod updates period data', () => {
    // Should not throw and should set valid period data
    useRitualStore.getState().refreshPeriod();
    const state = useRitualStore.getState();
    expect(['aurora', 'zenite', 'crepusculo']).toContain(state.currentPeriod);
    expect(state.periodGreeting).toBeTruthy();
  });
});

describe('RitualStore — Check-in', () => {
  it('isCheckInOpen starts false', () => {
    expect(useRitualStore.getState().isCheckInOpen).toBe(false);
  });

  it('openCheckIn sets true', () => {
    useRitualStore.getState().openCheckIn();
    expect(useRitualStore.getState().isCheckInOpen).toBe(true);
  });

  it('closeCheckIn sets false and clears reflection', () => {
    useRitualStore.getState().openCheckIn();
    useRitualStore.getState().setReflection('Some text');
    useRitualStore.getState().closeCheckIn();
    expect(useRitualStore.getState().isCheckInOpen).toBe(false);
    expect(useRitualStore.getState().reflectionText).toBe('');
  });
});

describe('RitualStore — Reflection', () => {
  it('reflectionText starts empty', () => {
    expect(useRitualStore.getState().reflectionText).toBe('');
  });

  it('setReflection stores text', () => {
    useRitualStore.getState().setReflection('Hoje foi um bom dia');
    expect(useRitualStore.getState().reflectionText).toBe('Hoje foi um bom dia');
  });

  it('setReflection overwrites previous', () => {
    useRitualStore.getState().setReflection('First');
    useRitualStore.getState().setReflection('Second');
    expect(useRitualStore.getState().reflectionText).toBe('Second');
  });
});
