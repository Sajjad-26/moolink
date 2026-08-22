import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectOS } from '@/lib/device';

// Where each app lives on the stores. Add new apps here.
const APP_STORE_URLS: Record<string, { ios: string; android: string }> = {
  facera: {
    ios: 'https://apps.apple.com/app/facera-ai-beauty-face-app/id6740647791',
    android: 'https://play.google.com/store/apps/details?id=com.facera.faceai',
  },
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// `https://moolink.xyz/app/<app>?ref=<creatorUsername>` — the creator's promo link.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appSlug: string }> }
) {
  const { appSlug } = await params;
  const url = new URL(request.url);
  const creatorRef = url.searchParams.get('ref') || url.searchParams.get('affiliate_ref');


  // Unknown app → send to homepage (defensive).
  if (!APP_STORE_URLS[appSlug]) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Resolve the creator's username → profile (skip silently if not an affiliate).
  let profileId: string | null = null;
  if (creatorRef) {
    const cleaned = creatorRef.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (cleaned) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_affiliate')
        .ilike('username', cleaned)
        .maybeSingle();
      if (profile?.is_affiliate) profileId = profile.id;
    }
  }

  // Record the click server-side (covers the "app not installed → store" path).
  if (profileId) {
    const userAgent = request.headers.get('user-agent') || '';
    const supabaseClick = await createClient();
    await supabaseClick.from('click_events').insert({
      link_id: null,
      profile_id: profileId,
      app_slug: appSlug,
      referrer: creatorRef,
      country: request.headers.get('x-vercel-ip-country') || null,
      device_type: detectOS(userAgent),
    }).then(() => {}, () => {});
  }

  const stores = APP_STORE_URLS[appSlug];
  const isIOS = /iPad|iPhone|iPod/.test(request.headers.get('user-agent') || '');

  const storeUrl = new URL(isIOS ? stores.ios : stores.android);
  // Android: pass the ref through for Play Install Referrer (best-effort).
  if (!isIOS && creatorRef) {
    storeUrl.searchParams.set('referrer', `ref=${creatorRef}`);
  }

  return NextResponse.redirect(storeUrl.toString());
}
