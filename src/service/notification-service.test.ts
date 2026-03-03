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
