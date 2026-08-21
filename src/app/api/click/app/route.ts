import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectOS } from '@/lib/device';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Facera pings this when it opens from a `moolink.xyz/app/facera?ref=<creator>`
// universal/app link. Counts a click for the creator even when the OS opened the
// app directly (server-side redirect never ran). Anonymous-only: no secrets.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const appSlug = url.searchParams.get('app');
  const ref = url.searchParams.get('ref') || url.searchParams.get('affiliate_ref');

  if (!appSlug || !ref) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const cleaned = ref.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (!cleaned) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_affiliate')
    .ilike('username', cleaned)
    .maybeSingle();

  if (profile) {
    const userAgent = request.headers.get('user-agent') || '';
    // Await so the insert completes before the response in the edge runtime.
    const { error: appClickErr } = await supabase.from('click_events').insert({
      link_id: null,
      profile_id: profile.id,
      app_slug: appSlug,
      referrer: ref,
      country: request.headers.get('x-vercel-ip-country') || null,
      device_type: detectOS(userAgent),
    });
    if (appClickErr) {
      console.error('App click tracking error:', appClickErr.message);
    }
    return NextResponse.json({ ok: true, counted: true, profileId: profile.id });
  }

  return NextResponse.json({ ok: true, counted: false });
}
