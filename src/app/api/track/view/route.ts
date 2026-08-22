import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { detectOS } from '@/lib/device';

export const runtime = 'edge';
export const preferredRegion = 'auto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, refTag } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Extract geo, device & referrer info
    const country = request.headers.get('x-vercel-ip-country') || null;
    const userAgent = request.headers.get('user-agent') || '';
    const rawReferrer = request.headers.get('referer') || null;

    const finalReferrer = refTag ? `ref:${refTag}` : rawReferrer;

    // Await tracking insert so it completes before edge response
    const { error: viewErr } = await supabase.from('page_views').insert({
      profile_id: profileId,
      country,
      device_type: detectOS(userAgent),
      referrer: finalReferrer,
    });

    if (viewErr) {
      console.error('View tracking error:', viewErr.message);
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
