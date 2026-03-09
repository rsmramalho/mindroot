// service/notification-service.ts — Browser + Push notifications
// alpha.11: Local notification scheduling, period transitions, overdue reminders

import { getCurrentPeriod, RITUAL_PERIODS } from '@/types/ui';
import type { RitualPeriod, AtomItem } from '@/types/item';
import { isPast, startOfDay, isToday } from 'date-fns';

export const notificationService = {
  // ─── Permission ─────────────────────────────────────────

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
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  // ─── Local notifications ────────────────────────────────

  send(title: string, options?: NotificationOptions): void {
    if (!('Notification' in window)) return;
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
    const pendingCount = this._pendingRitualCount;
    const body = pendingCount > 0
      ? `${period.greeting} — seu ${period.label} começou. ${pendingCount} ${pendingCount === 1 ? 'ritual pendente' : 'rituais pendentes'}.`
      : `${period.greeting} — seu ${period.label} começou.`;

    this.send(`MindRoot — ${period.label}`, {
      body,
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

  // ─── Period transition detection ────────────────────────

  checkPeriodTransition(lastPeriod: RitualPeriod): RitualPeriod | null {
    const current = getCurrentPeriod();
    if (current.key !== lastPeriod) {
      return current.key;
    }
    return null;
  },

  // ─── Scheduling helpers ─────────────────────────────────

  // Get ms until next period transition
  getMsUntilNextTransition(): number {
    const next = this.getNextTransitionTime();
    return Math.max(0, next.getTime() - Date.now());
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

  // ─── Overdue item counting ──────────────────────────────

  countOverdueItems(items: AtomItem[]): number {
    return items.filter((item) => {
      if (item.completed || item.archived) return false;
      if (!item.due_date) return false;
      const due = new Date(item.due_date);
      return isPast(startOfDay(due)) && !isToday(due);
    }).length;
  },

  // Should we send overdue reminder today?
  shouldSendOverdueReminder(lastCheckDate: string | null): boolean {
    if (!lastCheckDate) return true;
    const today = new Date().toISOString().slice(0, 10);
    return lastCheckDate !== today;
  },

  // ─── Internal state for ritual count in notifications ───

  _pendingRitualCount: 0,
  setPendingRitualCount(count: number): void {
    this._pendingRitualCount = count;
  },
};

