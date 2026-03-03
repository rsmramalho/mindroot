// service/notification-service.ts — Browser notifications
// Ritual period transitions + overdue reminders

import { getCurrentPeriod, RITUAL_PERIODS } from '@/types/ui';
import type { RitualPeriod } from '@/types/item';

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  isSupported(): boolean {
    return 'Notification' in window;
  },

  isEnabled(): boolean {
    return Notification.permission === 'granted';
  },

  send(title: string, options?: NotificationOptions): void {
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
    } catch {
      // Silent fail on unsupported platforms
    }
  },

  sendPeriodTransition(): void {
    const period = getCurrentPeriod();
    this.send(`MindRoot — ${period.greeting}`, {
      body: `Periodo ${period.label} iniciou. Hora do ritual.`,
      tag: 'period-transition',
    });
  },

  sendOverdueReminder(count: number): void {
    if (count === 0) return;
    const label = count === 1 ? '1 item atrasado' : `${count} itens atrasados`;
    this.send('MindRoot — Atenção', {
      body: label,
      tag: 'overdue-reminder',
    });
  },

  // Check if we should notify about period change
  // Returns the period key if transition happened
  checkPeriodTransition(lastPeriod: RitualPeriod): RitualPeriod | null {
    const current = getCurrentPeriod();
    if (current.key !== lastPeriod) {
      return current.key;
    }
    return null;
  },

  // Get next period transition time
  getNextTransitionTime(): Date {
    const now = new Date();
    const hour = now.getHours();

    for (const period of RITUAL_PERIODS) {
      if (hour < period.hours.start) {
        const next = new Date(now);
        next.setHours(period.hours.start, 0, 0, 0);
        return next;
      }
    }

    // Next day aurora
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(5, 0, 0, 0);
    return tomorrow;
  },
};
