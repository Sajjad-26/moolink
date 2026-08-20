import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findUserId(payload: any): Promise<string | null> {
  const data = payload?.data || payload;
  const userId = data?.metadata?.user_id || data?.customer?.metadata?.user_id;
  if (userId) return userId;

  const customerEmail = data?.customer?.email || data?.email;
  if (customerEmail) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const matchedUser = users?.users?.find(u => u.email === customerEmail);
    if (matchedUser) return matchedUser.id;
  }

  return null;
}

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = Uint8Array.from(signature.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
}

export async function POST(request: Request) {
  try {
    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-dodo-signature');
    const legacySecret = request.headers.get('x-webhook-secret');

    const isValid = (signature && await verifySignature(body, signature, secret)) ||
      (legacySecret && legacySecret === secret);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const eventType = payload?.type || payload?.event;
    const data = payload?.data || payload;
    const subscriptionId = data?.subscription_id || data?.id;

    if (
      eventType === 'subscription.created' ||
      eventType === 'subscription.active' ||
      eventType === 'payment.succeeded'
    ) {
      const userId = await findUserId(payload);
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            is_pro: true,
            dodo_subscription_id: subscriptionId || null,
            subscription_status: 'active',
          })
          .eq('user_id', userId);
      }
    } else if (
      eventType === 'subscription.cancelled' ||
      eventType === 'subscription.canceled' ||
      eventType === 'subscription.expired'
    ) {
      const userId = await findUserId(payload);
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            is_pro: false,
            subscription_status: 'canceled',
          })
          .eq('user_id', userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
