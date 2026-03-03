// hooks/useNotifications.ts — Notification management
// Checks period transitions and overdue items on interval

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/service/notification-service';
import { useRitualStore } from '@/store/ritual-store';
import type { RitualPeriod } from '@/types/item';

const CHECK_INTERVAL = 60_000; // 1 minute

export function useNotifications() {
  const [enabled, setEnabled] = useState(notificationService.isEnabled());
  const [supported] = useState(notificationService.isSupported());
  const lastPeriod = useRef<RitualPeriod>(useRitualStore.getState().currentPeriod);
  const { refreshPeriod } = useRitualStore();

  const enable = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setEnabled(granted);
    return granted;
  }, []);

  const disable = useCallback(() => {
    // Can't programmatically revoke — just track locally
    setEnabled(false);
  }, []);

  // Period transition checker
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const newPeriod = notificationService.checkPeriodTransition(lastPeriod.current);
      if (newPeriod) {
        lastPeriod.current = newPeriod;
        refreshPeriod();
        notificationService.sendPeriodTransition();
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled, refreshPeriod]);

  return {
    supported,
    enabled,
    enable,
    disable,
  };
}
