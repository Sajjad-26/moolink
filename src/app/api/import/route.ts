import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectIconFromUrl } from '@/lib/detect-icon';

export const maxDuration = 10;

async function isProfilePro(profile: { is_pro?: boolean | null; created_at?: string | null } | null): Promise<boolean> {
  if (!profile) return false;
  if (profile.is_pro) return true;
  if (profile.created_at) {
    const ageInMs = Date.now() - new Date(profile.created_at).getTime();
    if (ageInMs <= 7 * 24 * 60 * 60 * 1000) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { url: targetUrl } = await req.json();
    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Verify user identity using the anon key + Bearer token from client
    const authHeader = req.headers.get('authorization');
    const anonClient = await createClient();
    let user;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data } = await anonClient.auth.getUser(token);
      user = data.user;
    } else {
      const { data } = await anonClient.auth.getUser();
      user = data.user;
    }

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Use service role client for all DB operations to bypass RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      svcKey!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, username, is_pro, created_at')
      .eq('user_id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let res: Response;
    try {
      res = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      return NextResponse.json({ error: 'The site took too long to respond or blocked the request. Please add your links manually.' });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Could not fetch that page. Please check the URL and try again.' });
    }

    const html = await res.text();
    const extractedLinks: { title: string; url: string; icon: string }[] = [];
    const seenUrls = new Set<string>();

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const accountLinks = nextData?.props?.pageProps?.account?.links || nextData?.props?.pageProps?.links || [];
        for (const linkObj of accountLinks) {
          const lUrl = linkObj?.url || linkObj?.target;
          const lTitle = linkObj?.title || linkObj?.label || 'Imported Link';
          if (lUrl && !seenUrls.has(lUrl) && !lUrl.includes('linktr.ee')) {
            seenUrls.add(lUrl);
            extractedLinks.push({ title: lTitle.trim(), url: lUrl.trim(), icon: detectIconFromUrl(lUrl) });
          }
        }
      } catch {}
    }

    if (extractedLinks.length === 0) {
      const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
      let match;
      while ((match = anchorRegex.exec(html)) !== null) {
        const href = match[1];
        const innerContent = match[2].replace(/<[^>]+>/g, '').trim();
        if (
          href &&
          (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) &&
          !seenUrls.has(href) &&
          !href.includes('linktr.ee') &&
          !href.includes('beacons.ai') &&
          !href.includes('privacy') &&
          !href.includes('terms') &&
          !href.includes('cookie')
        ) {
          seenUrls.add(href);
          extractedLinks.push({ title: (innerContent || 'Link').slice(0, 40), url: href, icon: detectIconFromUrl(href) });
        }
      }
    }

    if (extractedLinks.length === 0) {
      return NextResponse.json({ error: 'No external links found on that page to import.' });
    }

    const isPro = await isProfilePro(profile);
    const { count: currentCount } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id);

    const existingCount = currentCount || 0;
    let allowedLinks = extractedLinks;

    if (!isPro) {
      const maxAllowed = Math.max(0, 3 - existingCount);
      if (maxAllowed === 0) {
        return NextResponse.json({ error: 'Free plan is limited to 3 links. Upgrade to Pro for unlimited imports!' });
      }
      allowedLinks = extractedLinks.slice(0, maxAllowed);
    }

    const { data: lastLink } = await supabase
      .from('links')
      .select('order_index')
      .eq('profile_id', profile.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const startIndex = (lastLink?.order_index ?? -1) + 1;

    const inserts = allowedLinks.map((item, idx) => ({
      profile_id: profile.id,
      title: item.title,
      url: item.url,
      icon: item.icon,
      order_index: startIndex + idx,
    }));

    const { error: insertErr } = await supabase.from('links').insert(inserts);
    if (insertErr) return NextResponse.json({ error: insertErr.message });

    return NextResponse.json({
      success: true,
      importedCount: inserts.length,
      skippedCount: extractedLinks.length - inserts.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to import links.' }, { status: 500 });
  }
}
