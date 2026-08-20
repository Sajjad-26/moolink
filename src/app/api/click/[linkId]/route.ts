import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { detectOS } from '@/lib/device';

export const runtime = 'edge';
export const preferredRegion = 'auto';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;

  const supabase = await createClient();
  const { data: link } = await supabase
    .from('links')
    .select('url, profile_id')
    .eq('id', linkId)
    .eq('is_active', true)
    .single();

  if (!link) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Extract geo, device & referrer info
  const country = request.headers.get('x-vercel-ip-country') || null;
  const userAgent = request.headers.get('user-agent') || '';
  const deviceType = detectOS(userAgent);
  const rawReferrer = request.headers.get('referer') || null;

  const reqUrl = new URL(request.url);
  let campaignRef = reqUrl.searchParams.get('ref');
  if (!campaignRef && rawReferrer) {
    try {
      campaignRef = new URL(rawReferrer).searchParams.get('ref');
    } catch {}
  }

  const finalReferrer = campaignRef ? `ref:${campaignRef}` : rawReferrer;

  // Fire-and-forget tracking
  supabase.from('click_events').insert({
    link_id: linkId,
    profile_id: link.profile_id,
    country,
    device_type: deviceType,
    referrer: finalReferrer,
  }).then(({ error }) => {
    if (error) console.error('Click tracking error:', error);
  });

  return NextResponse.redirect(link.url);
}
