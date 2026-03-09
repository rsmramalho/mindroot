// store/notification-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from './notification-store';

// Mock localStorage
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
});

describe('notification-store', () => {
  beforeEach(() => {
    // Clear storage and reset store
    Object.keys(storage).forEach((k) => delete storage[k]);
    useNotificationStore.getState().reset();
  });

  it('starts with defaults', () => {
    const state = useNotificationStore.getState();
    expect(state.enabled).toBe(false);
    expect(state.periodTransitions).toBe(true);
    expect(state.overdueReminders).toBe(true);
    expect(state.ritualReminders).toBe(true);
    expect(state.pushSubscribed).toBe(false);
    expect(state.promptDismissed).toBe(false);
    expect(state.lastOverdueCheck).toBeNull();
  });

  it('setEnabled persists to localStorage', () => {
    useNotificationStore.getState().setEnabled(true);
    expect(useNotificationStore.getState().enabled).toBe(true);
    const persisted = JSON.parse(storage['mindroot-notification-prefs']);
    expect(persisted.enabled).toBe(true);
  });

  it('setPreference updates individual keys', () => {
    useNotificationStore.getState().setPreference('periodTransitions', false);
    expect(useNotificationStore.getState().periodTransitions).toBe(false);
    const persisted = JSON.parse(storage['mindroot-notification-prefs']);
    expect(persisted.periodTransitions).toBe(false);
  });

  it('setPushSubscribed updates state', () => {
    useNotificationStore.getState().setPushSubscribed(true);
    expect(useNotificationStore.getState().pushSubscribed).toBe(true);
  });

  it('setPermissionState updates state', () => {
    useNotificationStore.getState().setPermissionState('granted');
    expect(useNotificationStore.getState().permissionState).toBe('granted');
  });

  it('dismissPrompt sets flag and persists', () => {
    useNotificationStore.getState().dismissPrompt();
    expect(useNotificationStore.getState().promptDismissed).toBe(true);
    const persisted = JSON.parse(storage['mindroot-notification-prefs']);
    expect(persisted.promptDismissed).toBe(true);
  });

  it('markOverdueChecked records today', () => {
    useNotificationStore.getState().markOverdueChecked();
    const today = new Date().toISOString().slice(0, 10);
    expect(useNotificationStore.getState().lastOverdueCheck).toBe(today);
  });

  it('reset clears everything', () => {
    useNotificationStore.getState().setEnabled(true);
    useNotificationStore.getState().setPushSubscribed(true);
    useNotificationStore.getState().dismissPrompt();

    useNotificationStore.getState().reset();

    const state = useNotificationStore.getState();
    expect(state.enabled).toBe(false);
    expect(state.pushSubscribed).toBe(false);
    expect(state.promptDismissed).toBe(false);
  });
});
