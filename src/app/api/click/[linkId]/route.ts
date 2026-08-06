import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { detectOS } from '@/lib/device';

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
  const referrer = request.headers.get('referer') || null;

  // Fire-and-forget tracking
  supabase.from('click_events').insert({
    link_id: linkId,
    profile_id: link.profile_id,
    country,
    device_type: deviceType,
    referrer,
  }).then(({ error }) => {
    if (error) console.error('Click tracking error:', error);
  });

  return NextResponse.redirect(link.url);
}
