// service/notification-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from './notification-service';

// Mock getCurrentPeriod and RITUAL_PERIODS
vi.mock('@/types/ui', () => ({
  getCurrentPeriod: vi.fn(() => ({
    key: 'aurora',
    label: 'Aurora',
    greeting: 'Bom dia',
    hours: { start: 5, end: 12 },
    color: '#f0c674',
  })),
  RITUAL_PERIODS: [
    { key: 'aurora', label: 'Aurora', greeting: 'Bom dia', hours: { start: 5, end: 12 }, color: '#f0c674' },
    { key: 'zenite', label: 'Zênite', greeting: 'Boa tarde', hours: { start: 12, end: 18 }, color: '#e8e0d4' },
    { key: 'crepusculo', label: 'Crepúsculo', greeting: 'Boa noite', hours: { start: 18, end: 5 }, color: '#8a6e5a' },
  ],
}));

describe('notificationService.checkPeriodTransition', () => {
  it('returns new period key when transition happened', () => {
    // getCurrentPeriod mock returns 'aurora'
    const result = notificationService.checkPeriodTransition('crepusculo');
    expect(result).toBe('aurora');
  });

  it('returns null when no transition', () => {
    const result = notificationService.checkPeriodTransition('aurora');
    expect(result).toBeNull();
  });
});

describe('notificationService.getNextTransitionTime', () => {
  it('returns a valid Date', () => {
    const next = notificationService.getNextTransitionTime();
    expect(next).toBeInstanceOf(Date);
    expect(next.getTime()).toBeGreaterThan(0);
  });
});

describe('notificationService.sendOverdueReminder', () => {
  beforeEach(() => {
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Notification', class MockNotification {
      static permission = 'granted';
      constructor(public title: string, public options?: NotificationOptions) {}
    });
  });

  it('does nothing when count is 0', () => {
    // Should not throw
    notificationService.sendOverdueReminder(0);
  });

  it('sends notification with singular label', () => {
    const spy = vi.fn();
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Notification', class MockN {
      static permission = 'granted';
      constructor(public title: string, public options?: NotificationOptions) {
        spy(title, options);
      }
    });
    notificationService.sendOverdueReminder(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1].body).toBe('1 item atrasado');
  });

  it('sends notification with plural label', () => {
    const spy = vi.fn();
    vi.stubGlobal('Notification', class MockN {
      static permission = 'granted';
      constructor(public title: string, public options?: NotificationOptions) {
        spy(title, options);
      }
    });
    notificationService.sendOverdueReminder(5);
    expect(spy.mock.calls[0][1].body).toBe('5 itens atrasados');
  });
});

describe('notificationService.isSupported', () => {
  it('returns true when Notification exists in global', () => {
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Notification', class { static permission = 'default'; });
    expect(notificationService.isSupported()).toBe(true);
  });
});

describe('notificationService.isEnabled', () => {
  it('returns true when permission is granted', () => {
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Notification', class { static permission = 'granted'; });
    expect(notificationService.isEnabled()).toBe(true);
  });

  it('returns false when permission is denied', () => {
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Notification', class { static permission = 'denied'; });
    expect(notificationService.isEnabled()).toBe(false);
  });
});

describe('notificationService.send', () => {
  it('does nothing when permission is not granted', () => {
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Notification', class MockN {
      static permission = 'denied';
      constructor() { throw new Error('should not instantiate'); }
    });
    // Should not throw
    notificationService.send('test');
  });
});

describe('notificationService.getPermissionState', () => {
  it('returns granted when Notification.permission is granted', () => {
    vi.stubGlobal('Notification', class { static permission = 'granted'; });
    expect(notificationService.getPermissionState()).toBe('granted');
  });

  it('returns unsupported when Notification is not available', () => {
    // Remove Notification from global
    const orig = (globalThis as Record<string, unknown>).Notification;
    delete (globalThis as Record<string, unknown>).Notification;
    expect(notificationService.getPermissionState()).toBe('unsupported');
    (globalThis as Record<string, unknown>).Notification = orig;
  });
});

describe('notificationService.countOverdueItems', () => {
  const makeItem = (due_date: string | null, completed = false, archived = false) => ({
    id: '1', user_id: 'u', title: 't', type: 'task' as const,
    module: null, priority: null, tags: [], parent_id: null,
    completed, completed_at: null, archived, due_date,
    due_time: null, recurrence: null, ritual_period: null,
    emotion_before: null, emotion_after: null, needs_checkin: false,
    is_chore: false, energy_cost: null, description: null,
    context: null, created_at: '2026-01-01T05:00:00Z', updated_at: '2026-01-01T05:00:00Z',
  });

  it('counts items with past due_date', () => {
    const items = [
      makeItem('2020-01-01'),
      makeItem('2020-06-15'),
      makeItem(null),
    ];
    expect(notificationService.countOverdueItems(items)).toBe(2);
  });

  it('excludes completed and archived items', () => {
    const items = [
      makeItem('2020-01-01', true),
      makeItem('2020-01-01', false, true),
    ];
    expect(notificationService.countOverdueItems(items)).toBe(0);
  });

  it('returns 0 when no overdue items', () => {
    const items = [makeItem(null)];
    expect(notificationService.countOverdueItems(items)).toBe(0);
  });
});

describe('notificationService.shouldSendOverdueReminder', () => {
  it('returns true when never checked', () => {
    expect(notificationService.shouldSendOverdueReminder(null)).toBe(true);
  });

  it('returns false when checked today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(notificationService.shouldSendOverdueReminder(today)).toBe(false);
  });

  it('returns true when checked yesterday', () => {
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    expect(notificationService.shouldSendOverdueReminder(yesterday)).toBe(true);
  });
});

describe('notificationService.getMsUntilNextTransition', () => {
  it('returns a non-negative number', () => {
    const ms = notificationService.getMsUntilNextTransition();
    expect(ms).toBeGreaterThanOrEqual(0);
  });
});

describe('notificationService.setPendingRitualCount', () => {
  it('updates internal count', () => {
    notificationService.setPendingRitualCount(5);
    expect(notificationService._pendingRitualCount).toBe(5);
    notificationService.setPendingRitualCount(0);
  });
});
