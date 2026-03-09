// supabase/functions/send-push/index.ts
// Edge Function: send push notifications to subscribed users
//
// SETUP REQUIRED:
// 1. Generate VAPID keys: npx web-push generate-vapid-keys
// 2. Set secrets in Supabase:
//    supabase secrets set VAPID_PUBLIC_KEY=<public_key>
//    supabase secrets set VAPID_PRIVATE_KEY=<private_key>
//    supabase secrets set VAPID_SUBJECT=mailto:your@email.com
// 3. Set VITE_VAPID_PUBLIC_KEY in .env (same public key)
//
// INVOKE: POST /functions/v1/send-push
// Body: { type: "period-transition" | "overdue-reminder", user_id?: string }
//
// Can be triggered by:
// - Supabase pg_cron (scheduled)
// - External cron service
// - Manual invocation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url: string;
}

interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@mindroot.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({
          error: 'VAPID keys not configured. Run: npx web-push generate-vapid-keys',
          setup: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, user_id } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query for subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: subscriptions, error: subError } = await query;
    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification payload based on type
    let payload: PushPayload;

    switch (type) {
      case 'period-transition': {
        const hour = new Date().getHours();
        let greeting = 'Boa noite';
        let period = 'Crepusculo';
        if (hour >= 5 && hour < 12) { greeting = 'Bom dia'; period = 'Aurora'; }
        else if (hour >= 12 && hour < 18) { greeting = 'Boa tarde'; period = 'Zenite'; }

        payload = {
          title: `MindRoot — ${period}`,
          body: `${greeting} — seu ${period} comecou.`,
          tag: 'period-transition',
          url: '/',
        };
        break;
      }

      case 'overdue-reminder': {
        // Count overdue items per user
        const userIds = [...new Set((subscriptions as PushSubscriptionRow[]).map((s) => s.user_id))];

        let totalSent = 0;
        for (const uid of userIds) {
          const { count } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('completed', false)
            .eq('archived', false)
            .lt('due_date', new Date().toISOString().slice(0, 10));

          if (count && count > 0) {
            const label = count === 1 ? '1 item atrasado' : `${count} itens atrasados`;
            const userSubs = (subscriptions as PushSubscriptionRow[]).filter((s) => s.user_id === uid);

            // Note: actual push sending requires Web Push protocol implementation
            // See sendPush function below
            for (const sub of userSubs) {
              const sent = await sendPush(sub, {
                title: 'MindRoot — Atencao',
                body: label,
                tag: 'overdue-reminder',
                url: '/',
              }, vapidPublicKey, vapidPrivateKey, vapidSubject);
              if (sent) totalSent++;
            }
          }
        }

        return new Response(
          JSON.stringify({ sent: totalSent, type: 'overdue-reminder' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send to all subscriptions
    let sent = 0;
    for (const sub of subscriptions as PushSubscriptionRow[]) {
      const ok = await sendPush(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject);
      if (ok) sent++;
    }

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Web Push sender ──────────────────────────────────────
// Sends push using VAPID auth. Payload encryption uses Web Push protocol (RFC 8291).
// For production: use https://deno.land/x/web_push or similar library.

async function sendPush(
  sub: PushSubscriptionRow,
  payload: PushPayload,
  _vapidPublicKey: string,
  _vapidPrivateKey: string,
  vapidSubject: string,
): Promise<boolean> {
  try {
    // Create VAPID JWT for authorization
    const audience = new URL(sub.endpoint).origin;
    const jwt = await createVapidJwt(audience, vapidSubject, _vapidPrivateKey);

    // For now: send without payload encryption (triggers SW push event)
    // The SW will receive the notification data via the push event
    const response = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${_vapidPublicKey}`,
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired — should be cleaned up
      console.log(`[push] Subscription expired: ${sub.endpoint.slice(0, 60)}...`);
      return false;
    }

    return response.ok;
  } catch (err) {
    console.error('[push] Send failed:', err);
    return false;
  }
}

// ─── VAPID JWT generation ─────────────────────────────────

async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string,
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 86400,
    sub: subject,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import private key for signing
  const keyData = base64UrlToArrayBuffer(privateKeyBase64);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken),
  );

  const sigB64 = arrayBufferToBase64Url(signature);
  return `${unsignedToken}.${sigB64}`;
}

function base64UrlToArrayBuffer(b64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
