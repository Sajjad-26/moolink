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

  // Await tracking insert so it completes before edge response
  const { error: clickErr } = await supabase.from('click_events').insert({
    link_id: linkId,
    profile_id: link.profile_id,
    country,
    device_type: deviceType,
    referrer: finalReferrer,
  });
  if (clickErr) {
    console.error('Click tracking error:', clickErr.message);
  }

  let destinationUrl = link.url;
  if (campaignRef) {
    try {
      const destUrlObj = new URL(destinationUrl);
      if (!destUrlObj.searchParams.has('ref') && !destUrlObj.searchParams.has('affiliate_ref')) {
        destUrlObj.searchParams.set('ref', campaignRef);
        destinationUrl = destUrlObj.toString();
      }
    } catch {}
  }

  return NextResponse.redirect(destinationUrl);
}
