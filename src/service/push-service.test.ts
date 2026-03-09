// service/push-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before import
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null })),
        })),
      })),
    })),
  },
}));

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_VAPID_PUBLIC_KEY: '' } } });

import { pushService } from './push-service';

describe('pushService.isSupported', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', {});
  });

  it('returns false when serviceWorker is missing', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', {});
    expect(pushService.isSupported()).toBe(false);
  });

  it('returns false when PushManager is missing', () => {
    vi.stubGlobal('navigator', { serviceWorker: {} });
    vi.stubGlobal('window', { Notification: class {} });
    expect(pushService.isSupported()).toBe(false);
  });

  it('returns true when all APIs are available', () => {
    vi.stubGlobal('navigator', { serviceWorker: {} });
    vi.stubGlobal('window', {
      PushManager: class {},
      Notification: class {},
    });
    // pushService checks window, not navigator for PushManager
    expect(pushService.isSupported()).toBe(true);
  });
});

describe('pushService.getSubscription', () => {
  it('returns null when not supported', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', {});
    const sub = await pushService.getSubscription();
    expect(sub).toBeNull();
  });
});

describe('pushService.hasVapidKey', () => {
  it('returns false when key is empty', () => {
    expect(pushService.hasVapidKey()).toBe(false);
  });
});
