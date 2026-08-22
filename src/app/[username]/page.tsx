import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getIcon, getSocialConfig } from '@/lib/icons';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import type { Profile, Link as LinkType } from '@/lib/types';
import { detectOS } from '@/lib/device';
import { THEMES, getTheme, type ThemeId } from '@/lib/themes';
import { HapticLink } from '@/components/haptic-link';

import { AutoCopyRef } from '@/components/auto-copy-ref';
import { ViewTracker } from '@/components/profile/view-tracker';

export const revalidate = 60;

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
  if (!profile || profile.is_archived) return { title: 'Not Found' };

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
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { username } = await params;
  const { ref } = await searchParams;



  const profile = await getProfile(username);
  if (!profile || profile.is_archived) notFound();

  const links = await getLinks(profile.id);
  const effectiveRef = ref || profile.username;

  const isPro = profile.is_pro || (() => {
    if (!profile.created_at) return false;
    const ageInMs = Date.now() - new Date(profile.created_at).getTime();
    return ageInMs <= 7 * 24 * 60 * 60 * 1000;
  })();

  // Fall back to basic theme if user lost Pro access but still has a Pro theme
  const isNatureTheme = profile.theme?.startsWith('nature-') || profile.theme?.startsWith('http');
  const effectiveTheme = !isPro && isNatureTheme ? 'classic-moo' : profile.theme;
  const theme = getTheme(effectiveTheme);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-4 pt-12 pb-6 relative bg-no-repeat overflow-x-hidden max-w-full w-full"
      style={{
        background: theme.bg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {effectiveRef && <AutoCopyRef refTag={effectiveRef} />}
      <ViewTracker profileId={profile.id} refTag={effectiveRef} />
      {/* Holstein patches — only on classic moo theme */}
      {(profile.theme === 'classic-moo' || !profile.theme) && (
        <div className="absolute inset-0 pointer-events-none cow-patch-bg" />
      )}
      <div className="w-full max-w-md flex flex-col items-center relative z-10 flex-1 justify-start">
        {/* Avatar */}
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name}
            width={96}
            height={96}
            priority
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

        <h1
          className="mt-4 text-2xl font-bold tracking-tight text-center"
          style={{
            color: theme.text,
            textShadow: theme.text === '#FFFFFF' || theme.text.toLowerCase().includes('fff')
              ? '0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.5)'
              : '0 1px 4px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,1)',
          }}
        >
          {profile.display_name || username}
        </h1>
        {profile.bio && (
          <p
            className="mt-2 text-center text-sm max-w-xs whitespace-pre-wrap break-words font-medium text-white"
            style={{
              color: '#FFFFFF',
              textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
            }}
          >
            {profile.bio}
          </p>
        )}

        <div className="w-full mt-8 space-y-3">
          {links.length === 0 && (
            <p
              className="text-center text-sm py-8 font-medium opacity-85"
              style={{ color: theme.sub || theme.text }}
            >
              No links yet 🐮
            </p>
          )}
          {links.map((link) => {
            const social = getSocialConfig(link.icon);
            return (
              <HapticLink
                key={link.id}
                href={`/api/click/${link.id}`}
                className="flex items-center gap-3.5 w-full px-5 py-4 rounded-2xl ios-liquid-glass text-left font-semibold text-sm text-black"
                style={{
                  color: '#000000',
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
              </HapticLink>
            );
          })}
        </div>
      </div>

      <footer className="relative z-10 mt-auto pt-10 pb-4 text-center">
        <a
          href="https://moolink.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-100 transition-opacity text-white drop-shadow-md bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15"
        >
          <span className="text-sm">🐮</span> Powered by MooLink
        </a>
      </footer>
    </div>
  );
}
