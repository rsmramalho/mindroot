// hooks/useNotifications.ts — Push + local notification management
// alpha.11: Push subscription, period scheduling, overdue reminders

import { useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/service/notification-service';
import { pushService } from '@/service/push-service';
import { useNotificationStore } from '@/store/notification-store';
import { useRitualStore } from '@/store/ritual-store';
import { useAppStore } from '@/store/app-store';
import type { RitualPeriod, AtomItem } from '@/types/item';

const OVERDUE_CHECK_INTERVAL = 5 * 60_000; // 5 minutes

export function useNotifications() {
  const user = useAppStore((s) => s.user);
  const { refreshPeriod } = useRitualStore();
  const store = useNotificationStore();

  const lastPeriod = useRef<RitualPeriod>(useRitualStore.getState().currentPeriod);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overdueInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const itemsRef = useRef<AtomItem[]>([]);

  // ─── Initialize permission state ────────────────────────

  useEffect(() => {
    const permState = notificationService.getPermissionState();
    store.setPermissionState(permState);

    const pushSupported = pushService.isSupported();
    store.setPreference('pushSupported', pushSupported);

    // Check existing push subscription
    if (pushSupported && permState === 'granted') {
      pushService.getSubscription().then((sub) => {
        store.setPushSubscribed(!!sub);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Enable notifications ───────────────────────────────

  const enable = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    const permState = notificationService.getPermissionState();
    store.setPermissionState(permState);

    if (granted) {
      store.setEnabled(true);

      // Try push subscription if supported and user is logged in
      if (pushService.isSupported() && user?.id) {
        const sub = await pushService.subscribe(user.id);
        store.setPushSubscribed(!!sub);
      }
    }

    return granted;
  }, [store, user?.id]);

  // ─── Disable notifications ──────────────────────────────

  const disable = useCallback(async () => {
    store.setEnabled(false);

    // Unsubscribe push
    if (user?.id) {
      await pushService.unsubscribe(user.id);
      store.setPushSubscribed(false);
    }

    // Clear timers
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
    if (overdueInterval.current) {
      clearInterval(overdueInterval.current);
      overdueInterval.current = null;
    }
  }, [store, user?.id]);

  // ─── Period transition scheduling ───────────────────────
  // Uses setTimeout to fire exactly at next transition, then reschedules

  useEffect(() => {
    if (!store.enabled || !store.periodTransitions) return;

    const scheduleNext = () => {
      const ms = notificationService.getMsUntilNextTransition();

      // Don't schedule if > 24h (safety check)
      if (ms > 24 * 60 * 60_000) return;

      transitionTimer.current = setTimeout(() => {
        const newPeriod = notificationService.checkPeriodTransition(lastPeriod.current);
        if (newPeriod) {
          lastPeriod.current = newPeriod;
          refreshPeriod();
          notificationService.sendPeriodTransition();
        }
        // Reschedule for next transition
        scheduleNext();
      }, ms + 1000); // +1s buffer to ensure we're past the boundary
    };

    scheduleNext();

    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }
    };
  }, [store.enabled, store.periodTransitions, refreshPeriod]);

  // ─── Overdue item check ─────────────────────────────────
  // Checks on interval, sends max 1x per day

  useEffect(() => {
    if (!store.enabled || !store.overdueReminders) return;

    const checkOverdue = () => {
      if (!notificationService.shouldSendOverdueReminder(store.lastOverdueCheck)) return;

      const count = notificationService.countOverdueItems(itemsRef.current);
      if (count > 0) {
        notificationService.sendOverdueReminder(count);
        store.markOverdueChecked();
      }
    };

    // Check on mount + every 5 minutes
    checkOverdue();
    overdueInterval.current = setInterval(checkOverdue, OVERDUE_CHECK_INTERVAL);

    return () => {
      if (overdueInterval.current) {
        clearInterval(overdueInterval.current);
        overdueInterval.current = null;
      }
    };
  }, [store, store.enabled, store.overdueReminders]);

  // ─── Update items ref for overdue counting ──────────────

  const updateItems = useCallback((items: AtomItem[]) => {
    itemsRef.current = items;

    // Also update pending ritual count for period notifications
    const pendingRituals = items.filter(
      (i) => i.type === 'ritual' && !i.completed && !i.archived
    ).length;
    notificationService.setPendingRitualCount(pendingRituals);
  }, []);

  return {
    supported: notificationService.isSupported(),
    enabled: store.enabled,
    permissionState: store.permissionState,
    pushSupported: store.pushSupported,
    pushSubscribed: store.pushSubscribed,
    periodTransitions: store.periodTransitions,
    overdueReminders: store.overdueReminders,
    ritualReminders: store.ritualReminders,
    promptDismissed: store.promptDismissed,
    enable,
    disable,
    updateItems,
    setPreference: store.setPreference,
    dismissPrompt: store.dismissPrompt,
  };
}

