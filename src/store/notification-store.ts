// store/notification-store.ts — Notification preferences (Zustand)
// alpha.11: persisted user preferences for push notifications

import { create } from 'zustand';

export interface NotificationPrefs {
  // Master toggle
  enabled: boolean;

  // Granular toggles
  periodTransitions: boolean; // Aurora → Zênite → Crepúsculo alerts
  overdueReminders: boolean; // Morning overdue item digest
  ritualReminders: boolean; // Ritual pending reminders

  // Push state
  pushSubscribed: boolean; // Has active push subscription
  pushSupported: boolean; // Browser supports push

  // Tracking
  lastOverdueCheck: string | null; // ISO date of last overdue notification
  permissionState: NotificationPermission | 'unsupported'; // 'granted' | 'denied' | 'default' | 'unsupported'
  promptDismissed: boolean; // User dismissed the soft prompt
}

interface NotificationState extends NotificationPrefs {
  setEnabled: (enabled: boolean) => void;
  setPreference: <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => void;
  setPushSubscribed: (subscribed: boolean) => void;
  setPermissionState: (state: NotificationPermission | 'unsupported') => void;
  dismissPrompt: () => void;
  markOverdueChecked: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'mindroot-notification-prefs';

function loadPersistedPrefs(): Partial<NotificationPrefs> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as Partial<NotificationPrefs>;
  } catch {
    return {};
  }
}

function persistPrefs(state: NotificationPrefs): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: state.enabled,
        periodTransitions: state.periodTransitions,
        overdueReminders: state.overdueReminders,
        ritualReminders: state.ritualReminders,
        promptDismissed: state.promptDismissed,
        lastOverdueCheck: state.lastOverdueCheck,
      })
    );
  } catch {
    // localStorage unavailable — silent
  }
}

const defaults: NotificationPrefs = {
  enabled: false,
  periodTransitions: true,
  overdueReminders: true,
  ritualReminders: true,
  pushSubscribed: false,
  pushSupported: false,
  permissionState: 'unsupported',
  lastOverdueCheck: null,
  promptDismissed: false,
};

const persisted = loadPersistedPrefs();

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...defaults,
  ...persisted,

  setEnabled: (enabled) => {
    set({ enabled });
    persistPrefs({ ...get(), enabled });
  },

  setPreference: (key, value) => {
    set({ [key]: value } as Partial<NotificationState>);
    const next = { ...get(), [key]: value };
    persistPrefs(next);
  },

  setPushSubscribed: (subscribed) => set({ pushSubscribed: subscribed }),

  setPermissionState: (state) => set({ permissionState: state }),

  dismissPrompt: () => {
    set({ promptDismissed: true });
    persistPrefs({ ...get(), promptDismissed: true });
  },

  markOverdueChecked: () => {
    const today = new Date().toISOString().slice(0, 10);
    set({ lastOverdueCheck: today });
    persistPrefs({ ...get(), lastOverdueCheck: today });
  },

  reset: () => {
    set(defaults);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  },
}));
