import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Commission is earned only on the FIRST paid transaction per subscriber
// (INITIAL_PURCHASE = new subscription; NON_RENEWING_PURCHASE = one-time),
// NOT on renewals. Each credited subscriber is worth a flat 30% of net proceeds.
const COMMISSIONABLE_EVENTS = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE']);
const DEFAULT_COMMISSION_RATE = 0.30;
const SALE_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE', 'TEST', 'PRODUCT_CHANGE']);

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// RevenueCat HMAC: header "X-RevenueCat-Webhook-Signature: t=<ts>,v1=<hex>"
async function verifyHmacSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = Object.fromEntries(
      signature.split(',').map(p => {
        const idx = p.indexOf('=');
        return [p.slice(0, idx), p.slice(idx + 1)];
      })
    );
    const timestamp = parts.t;
    const expected = parts.v1;
    if (!timestamp || !expected) return false;

    // Reject replay > 10 min
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 600) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from((expected.match(/.{1,2}/g) ?? []).map(b => parseInt(b, 16)));
    return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`${timestamp}.${body}`));
  } catch {
    return false;
  }
}

function verifyAuth(request: Request, body: string, secret: string): Promise<boolean> | boolean {
  // 1. Authorization header: "Bearer <secret>" or "<secret>"
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token === secret) return true;
  }

  // 2. Custom header: "X-Webhook-Secret"
  const legacySecret = request.headers.get('x-webhook-secret');
  if (legacySecret && legacySecret === secret) return true;

  // 3. HMAC signature: "X-RevenueCat-Webhook-Signature" or "X-RevenueCat-Signature"
  const signature = request.headers.get('x-revenuecat-webhook-signature') || request.headers.get('x-revenuecat-signature');
  if (signature) {
    return verifyHmacSignature(body, signature, secret);
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await request.text();
    const isAuthorized = await verifyAuth(request, body, secret);

    if (!isAuthorized) {
      console.warn('[RevenueCat Webhook] Unauthorized request received');
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload?.event;
    const type = event?.type;

    console.log(`[RevenueCat Webhook] Processing event type: ${type}, id: ${event?.id}`);

    // If it's a test event from RevenueCat dashboard, acknowledge it
    if (type === 'TEST') {
      return NextResponse.json({ received: true, test: true });
    }

    if (event && SALE_EVENTS.has(type)) {
      const rawPrice = event.price_in_purchased_currency ?? event.price ?? 0;
      const price = Number(rawPrice);
      const currency = event.currency ?? 'USD';
      const purchasedAt = event.purchased_at_ms ?? event.event_timestamp_ms;
      const purchasedAtDate = purchasedAt ? new Date(Number(purchasedAt)) : new Date();
      const period = `${purchasedAtDate.getUTCFullYear()}-${String(purchasedAtDate.getUTCMonth() + 1).padStart(2, '0')}`;

      // Extract affiliate ref from subscriber attributes
      const subAttrs = event.subscriber_attributes || {};
      const ref = subAttrs.affiliate_ref?.value ||
                  subAttrs.ref?.value ||
                  subAttrs.affiliate?.value ||
                  null;
      const appUserId = event.app_user_id ?? null;

      // Resolve the ref (username) → profile id + rate (default 30% flat).
      let profileId: string | null = null;
      let rate = DEFAULT_COMMISSION_RATE;

      if (ref) {
        const cleaned = ref.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        if (cleaned) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, commission_rate')
            .ilike('username', cleaned)
            .maybeSingle();

          if (profile) {
            profileId = profile.id;
            rate = profile.commission_rate != null ? Number(profile.commission_rate) : DEFAULT_COMMISSION_RATE;
          }
        }
      }

      // Net proceeds = what the developer actually keeps after store fees + taxes.
      const takehomePct = Number(event.takehome_percentage ?? 0.85);
      const taxPct = Number(event.tax_percentage ?? 0);
      const proceeds = price * takehomePct * (1 - taxPct);

      // Commission only on the FIRST paid transaction (new subscribers), not renewals.
      const isCommissionable = COMMISSIONABLE_EVENTS.has(type);
      const commission = isCommissionable && profileId ? round2(proceeds * rate) : 0;

      // Idempotent insert keyed on the RevenueCat event id.
      const eventId = event.id || `rc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const { error: insertError } = await supabaseAdmin.from('affiliate_sales').upsert(
        {
          rc_event_id: eventId,
          profile_id: profileId,
          ref: ref,
          app_user_id: appUserId,
          event_type: type,
          price: round2(price),
          currency,
          proceeds: round2(proceeds),
          commission: round2(commission),
          period,
          purchased_at: purchasedAtDate.toISOString(),
        },
        { onConflict: 'rc_event_id' }
      );

      if (insertError) {
        console.error('[RevenueCat Webhook] Database upsert error:', insertError.message);
      } else {
        console.log(`[RevenueCat Webhook] Recorded sale for ref=${ref}, profileId=${profileId}, commission=${commission}`);
      }
    }

    // Always ack 200
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[RevenueCat Webhook] Processing failed:', err?.message || err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
