// service/push-service.ts — Web Push subscription management
// alpha.11: register/unsubscribe push, save subscription to Supabase

import { supabase } from './supabase';

// VAPID public key — set via env var, fallback for local dev
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Convert VAPID key from URL-safe base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export const pushService = {
  // Check if Push API is available
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  // Get current push subscription (if any)
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      return reg.pushManager.getSubscription();
    } catch {
      return null;
    }
  },

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.isSupported() || !VAPID_PUBLIC_KEY) return null;

    try {
      const reg = await navigator.serviceWorker.ready;

      // Check existing subscription
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Already subscribed — ensure it's saved in DB
        await this.saveSubscription(userId, existing);
        return existing;
      }

      // Create new subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      // Save to Supabase
      await this.saveSubscription(userId, subscription);
      return subscription;
    } catch (err) {
      console.error('[push] Subscribe failed:', err);
      return null;
    }
  },

  // Unsubscribe from push notifications
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (!subscription) return true;

      // Remove from browser
      await subscription.unsubscribe();

      // Remove from Supabase
      await this.removeSubscription(userId, subscription.endpoint);

      return true;
    } catch (err) {
      console.error('[push] Unsubscribe failed:', err);
      return false;
    }
  },

  // Save subscription to Supabase push_subscriptions table
  async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('[push] Save subscription failed:', error);
    }
  },

  // Remove subscription from Supabase
  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[push] Remove subscription failed:', error);
    }
  },

  // Check if VAPID key is configured
  hasVapidKey(): boolean {
    return VAPID_PUBLIC_KEY.length > 0;
  },
};
