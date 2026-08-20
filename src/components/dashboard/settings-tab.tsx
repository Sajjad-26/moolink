'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile, updateTheme } from '@/app/dashboard/actions';
import { setAffiliateStatus } from '@/app/dashboard/earnings-actions';
import { Loader2, Check, Paintbrush, ExternalLink, User, AtSign, AlignLeft, Sparkles, Upload, Copy, Zap, Share2, Tag, Coins } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { THEMES, getTheme, formatImageUrl, type ThemeId } from '@/lib/themes';
import { createClient } from '@/lib/supabase/client';
import { getSocialConfig, getIcon } from '@/lib/icons';
import type { Link as LinkType } from '@/lib/types';
import { CropModal } from './crop-modal';

const LIGHT_THEME_IDS: ThemeId[] = [
  'pure-white', 'classic-moo', 'sunset-glow', 'forest-green',
  'ocean-breeze', 'blush-pink', 'golden-hour', 'lavender-haze'
];

const NATURE_THEME_IDS: ThemeId[] = [
  'nature-forest', 'nature-alps', 'nature-sunset', 'nature-aurora',
  'nature-tropic', 'nature-jungle', 'nature-dunes', 'nature-waves'
];

export function SettingsTab({ profile, isPro }: { profile: Profile; isPro: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [theme, setThemeLocal] = useState<string>(profile.theme || 'classic-moo');
  const [customBgUrl, setCustomBgUrl] = useState(
    profile.theme && (profile.theme.startsWith('http') || profile.theme.startsWith('url')) ? profile.theme : ''
  );
  const [themeCategory, setThemeCategory] = useState<'nature' | 'light' | 'dark'>('nature');
  const [campaignTag, setCampaignTag] = useState('');
  const [copiedTag, setCopiedTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [affiliateToggling, setAffiliateToggling] = useState(false);

  const t = getTheme(theme);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('links').select('*').eq('profile_id', profile.id).eq('is_active', true)
      .order('order_index', { ascending: true }).limit(4).then(({ data }) => setLinks(data || []));
  }, [profile.id]);

  const hasProfileChanges =
    username !== profile.username ||
    displayName !== (profile.display_name || '') ||
    bio !== (profile.bio || '') ||
    avatarUrl !== (profile.avatar_url || '');

  const handleThemeChange = async (newTheme: string) => {
    const formatted = formatImageUrl(newTheme);
    if (!isPro && (NATURE_THEME_IDS.includes(formatted as ThemeId) || formatted.startsWith('http'))) {
      return;
    }
    setThemeLocal(formatted);
    setSaving(true);
    setThemeMessage('');

    const result = await updateTheme(formatted);
    setSaving(false);

    if (result?.error) {
      setThemeMessage(result.error);
    } else {
      setThemeMessage('Applied!');
      router.refresh();
      setTimeout(() => setThemeMessage(''), 1800);
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropImage(null);
    setUploading(true);
    setUploadError('');
    const form = new FormData();
    form.append('file', blob, 'profile.png');
    try {
      const res = await fetch('/api/avatar/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
      } else {
        setUploadError(data.error || 'Upload failed. Please try a smaller image.');
      }
    } catch {
      setUploadError('Could not upload image. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAffiliateToggle = async (enabled: boolean) => {
    setAffiliateToggling(true);
    try {
      const result = await setAffiliateStatus(enabled);
      if (result?.error) {
        setProfileMessage({ type: 'error', text: result.error });
      } else {
        setProfileMessage({ type: 'success', text: enabled ? 'Commissions enabled!' : 'Commissions disabled.' });
        router.refresh();
        setTimeout(() => setProfileMessage(null), 2500);
      }
    } finally {
      setAffiliateToggling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage(null);

    if (!username.trim() || username.length < 3) {
      setLoading(false);
      setProfileMessage({ type: 'error', text: 'Username must be at least 3 characters.' });
      return;
    }
    if (bio.length > 160) {
      setLoading(false);
      setProfileMessage({ type: 'error', text: 'Bio must be 160 characters or less.' });
      return;
    }

    const form = new FormData();
    form.append('username', username);
    form.append('display_name', displayName);
    form.append('bio', bio);
    form.append('theme', theme || 'classic-moo');
    form.append('avatar_url', avatarUrl || '');

    const result = await updateProfile(form);
    setLoading(false);

    if (result?.error) {
      setProfileMessage({ type: 'error', text: result.error });
    } else {
      setProfileMessage({ type: 'success', text: 'Profile saved successfully!' });
      router.refresh();
      setTimeout(() => setProfileMessage(null), 3000);
    }
  };

  const filteredThemes = (Object.entries(THEMES) as [ThemeId, typeof THEMES['classic-moo']][]).filter(([id]) => {
    if (themeCategory === 'nature') return NATURE_THEME_IDS.includes(id);
    if (themeCategory === 'light') return LIGHT_THEME_IDS.includes(id);
    if (themeCategory === 'dark') return !LIGHT_THEME_IDS.includes(id) && !NATURE_THEME_IDS.includes(id);
    return true;
  });

  const MiniPreview = () => (
    <div className="border-[6px] border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-[210px] mx-auto w-full transition-all duration-300">
      <div className="flex justify-center bg-zinc-900 py-1.5">
        <div className="w-[50px] h-3.5 bg-black rounded-full relative flex items-center justify-end pr-1">
          <div className="w-1 h-1 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div
        className="min-h-[380px] flex flex-col items-center p-3 transition-all bg-no-repeat"
        style={{
          background: t.bg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {avatarUrl || profile.avatar_url ? (
          <img
            src={avatarUrl || profile.avatar_url || ''}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white/20 mt-1"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white/20 mt-1"
            style={{ backgroundColor: t.accent, color: t.accentText }}
          >
            {(displayName || username).charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className="mt-1.5 font-bold text-[10px] text-center px-2 truncate max-w-full"
          style={{
            color: t.text,
            textShadow: t.text === '#FFFFFF' || t.text.toLowerCase().includes('fff')
              ? '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.4)'
              : '0 1px 2px rgba(255,255,255,0.9), 0 0 1px rgba(255,255,255,1)',
          }}
        >
          {displayName || username}
        </div>
        {bio && (
          <div
            className="mt-0.5 text-[8px] text-center leading-tight px-2 line-clamp-2 font-medium text-white"
            style={{
              color: '#FFFFFF',
              textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)',
            }}
          >
            {bio}
          </div>
        )}
        <div className="w-full mt-3 space-y-1.5 flex-1">
          {(links.length > 0 ? links : [
            { id: '1', title: 'Visit My Website', icon: 'link' },
            { id: '2', title: 'Instagram Profile', icon: 'instagram' },
            { id: '3', title: 'YouTube Channel', icon: 'youtube' },
          ]).map((l) => {
            const social = getSocialConfig(l.icon);
            return (
              <div
                key={l.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ios-liquid-glass text-[8px] font-semibold text-black"
                style={{
                  color: '#000000',
                }}
              >
                {social ? (
                  <span
                    className="inline-flex items-center justify-center w-3.5 h-3.5 flex-shrink-0"
                    dangerouslySetInnerHTML={{
                      __html: social.svg
                        .replace(/width="\d+"/g, 'width="12"')
                        .replace(/height="\d+"/g, 'height="12"'),
                    }}
                  />
                ) : (
                  <span className="text-[10px]">{getIcon(l.icon)}</span>
                )}
                <span className="truncate flex-1">{l.title}</span>
              </div>
            );
          })}
        </div>
        <div
          className="mt-auto pt-3 pb-1 text-[7px] font-semibold flex items-center gap-0.5 opacity-95"
          style={{
            color: t.sub || t.text,
            textShadow: t.text === '#FFFFFF' || t.text.toLowerCase().includes('fff')
              ? '0 1px 3px rgba(0,0,0,0.8)'
              : '0 1px 2px rgba(255,255,255,0.9)',
          }}
        >
          {!isPro && <><span>🐮</span> Powered by MooLink</>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <User className="w-4 h-4 text-amber-700" /> Profile Information
              </CardTitle>
              <CardDescription className="text-xs">Customize how visitors see your page</CardDescription>
            </div>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors w-fit"
            >
              View Live Page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-muted-foreground" /> Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    required
                    placeholder="your-username"
                    className="h-9 text-sm pr-8"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground font-mono">@</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Display Name
                </Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Profile Picture
              </Label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-400/80 text-amber-900 flex items-center justify-center font-bold text-base overflow-hidden flex-shrink-0 shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (displayName || username).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors shadow-xs">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {uploadError && (
                <p className="text-xs text-red-600 font-medium">{uploadError}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio" className="text-xs font-semibold flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" /> Bio
                </Label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  bio.length >= 150 ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-muted text-muted-foreground'
                }`}>
                  {bio.length}/160
                </span>
              </div>
              <Textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell your herd about yourself..."
                rows={2}
                className="min-h-[50px] text-sm resize-none"
                maxLength={160}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {profileMessage && (
                  <div className={`text-xs px-3 py-1 rounded-md flex items-center gap-1.5 font-medium ${
                    profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {profileMessage.type === 'success' && <Check className="w-3.5 h-3.5" />}
                    {profileMessage.text}
                  </div>
                )}
              </div>
              {hasProfileChanges && (
                <Button type="submit" disabled={loading} size="sm" className="bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs">
                  {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Settings — Campaign Link Generator */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Zap className="w-4 h-4 text-amber-700" /> Advanced Settings: Campaign Links
          </CardTitle>
          <CardDescription className="text-xs">
            Generate custom campaign tracking links for your marketing channels and promoters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign_tag" className="text-xs font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Campaign Tag Name
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                id="campaign_tag"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
                placeholder="e.g. quotes_1, reels_promo, viral_tiktok"
                className="h-9 text-xs font-mono flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://moolink.xyz'}/${profile.username}${campaignTag.trim() ? `?ref=${campaignTag.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')}` : ''}`;
                  navigator.clipboard.writeText(url);
                  setCopiedTag(campaignTag || 'default');
                  setTimeout(() => setCopiedTag(''), 2000);
                }}
                className="bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs h-9 px-4 flex-shrink-0 gap-1.5"
              >
                {copiedTag === (campaignTag || 'default') ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-300" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Campaign Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generated URL Box */}
          <div className="p-3 bg-muted/60 rounded-xl border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
                Generated Tracking Link
              </div>
              <div className="font-mono text-xs text-foreground font-semibold truncate">
                {typeof window !== 'undefined' ? window.location.origin : 'https://moolink.xyz'}/{profile.username}{campaignTag.trim() ? `?ref=${campaignTag.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')}` : ''}
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
              🏷️ Clicks tracked in Analytics
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate / Earnings */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Coins className="w-4 h-4 text-amber-700" /> Earnings & Commissions
          </CardTitle>
          <CardDescription className="text-xs">
            Earn a share of MooLink’s monthly revenue. When enabled, every click on your page earns you
            a pro-rata cut of the 35% revenue pool split between all affiliate pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 bg-muted/60 rounded-xl border border-border/80">
            <div className="flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold">Participate in the affiliate pool</div>
                <div className="text-xs text-muted-foreground">
                  {profile.is_affiliate
                    ? 'You’re earning commissions on your clicks. Track them in the Earnings tab.'
                    : 'Turn on to start earning 35% of monthly revenue split by clicks.'}
                </div>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => handleAffiliateToggle(!profile.is_affiliate)}
              disabled={affiliateToggling}
              className={
                profile.is_affiliate
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex-shrink-0'
                  : 'bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs flex-shrink-0'
              }
            >
              {affiliateToggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : profile.is_affiliate ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Enabled
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" /> Enable
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Commissions are calculated from net proceeds reported by RevenueCat. You can disable this anytime.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Paintbrush className="w-4 h-4 text-amber-700" /> Themes & Wallpapers
                </CardTitle>
                <CardDescription className="text-xs">Choose a style or HD Unsplash nature wallpaper for your page</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                {themeMessage && <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-200 animate-in fade-in">{themeMessage}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 bg-muted/70 p-1 rounded-lg w-fit mt-3">
              <button
                type="button"
                onClick={() => setThemeCategory('nature')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  themeCategory === 'nature' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                HD Nature 🌲 (8)
              </button>
              <button
                type="button"
                onClick={() => setThemeCategory('light')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  themeCategory === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Light (8)
              </button>
              <button
                type="button"
                onClick={() => setThemeCategory('dark')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  themeCategory === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dark & Glass (10)
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {filteredThemes.map(([id, th]) => {
                const isActive = theme === id;
                const isNature = id.startsWith('nature-');
                const locked = isNature && !isPro;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => !locked && handleThemeChange(id)}
                    disabled={saving || locked}
                    className={`relative h-24 rounded-xl border-2 transition-all duration-200 overflow-hidden bg-no-repeat ${
                      locked
                        ? 'border-border/40 cursor-not-allowed opacity-60'
                        : isActive
                        ? 'border-amber-600 ring-2 ring-amber-500/30 shadow-md scale-[1.02]'
                        : 'border-border/60 hover:border-amber-500/50 hover:scale-[1.01]'
                    }`}
                    style={{
                      background: th.bg,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {isActive && !locked && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    {locked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">🔒 Pro</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-border/60 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Custom Wallpaper Image URL
                {!isPro && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">Pro</span>}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={customBgUrl}
                  onChange={(e) => setCustomBgUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or https://pexels.com/..."
                  className="h-9 text-xs font-mono"
                  disabled={!isPro}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!customBgUrl.trim() || !isPro) return;
                    const formatted = formatImageUrl(customBgUrl.trim());
                    setCustomBgUrl(formatted);
                    handleThemeChange(formatted);
                  }}
                  disabled={!customBgUrl.trim() || saving || !isPro}
                  className="bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs h-9 px-3 flex-shrink-0"
                >
                  Apply Wallpaper
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isPro
                  ? 'Paste any direct image URL from Unsplash or Pexels to set as your page wallpaper.'
                  : 'Upgrade to Pro to use custom wallpaper images.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview (2 columns) */}
        <Card className="lg:col-span-2 border-border shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Live Mobile Preview</span>
              <span className="text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Active Theme: <strong className="text-foreground">{t.name}</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center pt-2 pb-4">
            <MiniPreview />
          </CardContent>
        </Card>
      </div>

      {cropImage && (
        <CropModal
          open={!!cropImage}
          onClose={() => setCropImage(null)}
          image={cropImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

