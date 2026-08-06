import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getIcon, getSocialConfig } from '@/lib/icons';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import type { Profile, Link as LinkType } from '@/lib/types';
import { headers } from 'next/headers';
import { detectOS } from '@/lib/device';
import { THEMES, type ThemeId } from '@/lib/themes';

export const revalidate = 60;

async function trackPageView(profileId: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const referrer = headersList.get('referer') || null;
    const country = headersList.get('x-vercel-ip-country') || null;

    await supabase.from('page_views').insert({
      profile_id: profileId,
      country,
      device_type: detectOS(userAgent),
      referrer,
    });
  } catch {
    // never fail the page load
  }
}

async function getProfile(username: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  return profile as Profile | null;
}

async function getLinks(profileId: string) {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  return (links as LinkType[]) || [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: 'Not Found' };

  const title = profile.display_name || username;
  const description = profile.bio || `${title} on MooLink`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og/${username}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og/${username}`],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const links = await getLinks(profile.id);
  await trackPageView(profile.id);

  const theme = THEMES[(profile.theme as ThemeId) || 'classic-moo'] || THEMES['classic-moo'];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16 relative" style={{ background: theme.bg }}>
      {/* Holstein patches — only on classic moo theme */}
      {(profile.theme === 'classic-moo' || !profile.theme) && (
        <div className="absolute inset-0 pointer-events-none cow-patch-bg" />
      )}
      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Avatar */}
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name}
            width={96}
            height={96}
            className="rounded-full border-4 shadow-xl"
            style={{ borderColor: theme.border }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-xl"
            style={{ backgroundColor: theme.accent, color: theme.accentText }}
          >
            {(profile.display_name || username).charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: theme.text }}>
          {profile.display_name || username}
        </h1>
        {profile.bio && (
          <p className="mt-2 text-center text-sm max-w-xs whitespace-pre-wrap break-words opacity-90" style={{ color: theme.sub }}>
            {profile.bio}
          </p>
        )}

        <div className="w-full mt-8 space-y-3">
          {links.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: theme.sub }}>No links yet 🐮</p>
          )}
          {links.map((link) => {
            const social = getSocialConfig(link.icon);
            return (
              <a
                key={link.id}
                href={`/api/click/${link.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl border hover:-translate-y-0.5 transition-all duration-200 text-left"
                style={{
                  background: theme.cardBg || theme.card,
                  backdropFilter: theme.backdropFilter || 'none',
                  WebkitBackdropFilter: theme.backdropFilter || 'none',
                  borderColor: theme.border,
                  color: theme.text,
                  boxShadow: theme.shadow || '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                {social ? (
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                    dangerouslySetInnerHTML={{
                      __html: social.svg
                        .replace(/width="\d+"/g, 'width="24"')
                        .replace(/height="\d+"/g, 'height="24"'),
                    }}
                  />
                ) : (
                  <span className="text-xl flex-shrink-0">{getIcon(link.icon)}</span>
                )}
                <span className="font-semibold text-sm tracking-wide flex-1 truncate">{link.title}</span>
              </a>
            );
          })}
        </div>

        {!profile.is_pro && (
          <Link
            href="/"
            className="mt-12 flex items-center gap-1.5 text-xs hover:opacity-80 transition-colors"
            style={{ color: theme.sub }}
          >
            <span className="text-sm">🐮</span> Powered by MooLink
          </Link>
        )}
      </div>
    </div>
  );
}
