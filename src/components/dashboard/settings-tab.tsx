'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from '@/app/dashboard/actions';
import { Loader2, Check, Paintbrush, ExternalLink, User, AtSign, AlignLeft, Sparkles, ShieldCheck } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { THEMES, type ThemeId } from '@/lib/themes';
import { createClient } from '@/lib/supabase/client';
import { getSocialConfig, getIcon } from '@/lib/icons';
import type { Link as LinkType } from '@/lib/types';

const LIGHT_THEME_IDS: ThemeId[] = [
  'pure-white', 'classic-moo', 'sunset-glow', 'forest-green',
  'ocean-breeze', 'blush-pink', 'golden-hour', 'lavender-haze'
];

export function SettingsTab({ profile }: { profile: Profile }) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [theme, setThemeLocal] = useState<ThemeId>((THEMES[profile.theme as ThemeId] ? profile.theme : 'classic-moo') as ThemeId);
  const [themeCategory, setThemeCategory] = useState<'all' | 'light' | 'dark'>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);

  const t = THEMES[theme];

  useEffect(() => {
    const supabase = createClient();
    supabase.from('links').select('*').eq('profile_id', profile.id).eq('is_active', true)
      .order('order_index', { ascending: true }).limit(4).then(({ data }) => setLinks(data || []));
  }, [profile.id]);

  const hasProfileChanges =
    username !== profile.username ||
    displayName !== (profile.display_name || '') ||
    bio !== (profile.bio || '');

  const handleThemeChange = async (newTheme: ThemeId) => {
    setThemeLocal(newTheme);
    setSaving(true);
    setThemeMessage('');

    const form = new FormData();
    form.append('username', profile.username);
    form.append('display_name', profile.display_name || '');
    form.append('bio', profile.bio || '');
    form.append('theme', newTheme);

    const result = await updateProfile(form);
    setSaving(false);

    if (result?.error) {
      setThemeMessage('Failed to update theme');
    } else {
      setThemeMessage('Applied!');
      setTimeout(() => setThemeMessage(''), 1800);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage(null);

    const form = new FormData();
    form.append('username', username);
    form.append('display_name', displayName);
    form.append('bio', bio);
    form.append('theme', theme || 'classic-moo');

    const result = await updateProfile(form);
    setLoading(false);

    if (result?.error) {
      setProfileMessage({ type: 'error', text: result.error });
    } else {
      setProfileMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setProfileMessage(null), 3000);
    }
  };

  const filteredThemes = (Object.entries(THEMES) as [ThemeId, typeof THEMES['classic-moo']][]).filter(([id]) => {
    if (themeCategory === 'light') return LIGHT_THEME_IDS.includes(id);
    if (themeCategory === 'dark') return !LIGHT_THEME_IDS.includes(id);
    return true;
  });

  const MiniPreview = () => (
    <div className="border-[6px] border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-[210px] mx-auto w-full transition-all duration-300">
      {/* Phone Notch */}
      <div className="flex justify-center bg-zinc-900 py-1.5">
        <div className="w-[54px] h-3.5 bg-black rounded-full flex items-center justify-end px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="min-h-[350px] flex flex-col items-center p-3.5" style={{ background: t.bg }}>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white/20"
          style={{ backgroundColor: t.accent, color: t.accentText }}
        >
          {(displayName || username).charAt(0).toUpperCase()}
        </div>
        <div className="mt-2 font-bold text-[10px] text-center px-2 tracking-tight" style={{ color: t.text }}>
          {displayName || username}
        </div>
        {bio && (
          <div className="mt-0.5 text-[8px] text-center leading-tight px-2 line-clamp-2 break-words opacity-85" style={{ color: t.sub }}>
            {bio}
          </div>
        )}
        <div className="w-full mt-3 space-y-1.5 flex-1">
          {links.slice(0, 3).map((link) => {
            const social = getSocialConfig(link.icon);
            return (
              <div
                key={link.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[8px] shadow-sm transition-all"
                style={{
                  background: t.cardBg || t.card,
                  backdropFilter: t.backdropFilter || 'none',
                  WebkitBackdropFilter: t.backdropFilter || 'none',
                  borderColor: t.border,
                  color: t.text,
                }}
              >
                {social ? (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: t.accent }}
                    dangerouslySetInnerHTML={{
                      __html: social.svg
                        .replace(/width="\d+"/g, 'width="10"')
                        .replace(/height="\d+"/g, 'height="10"'),
                    }}
                  />
                ) : (
                  <span className="text-[9px] flex-shrink-0">{getIcon(link.icon)}</span>
                )}
                <span className="font-medium truncate flex-1">{link.title}</span>
              </div>
            );
          })}
          {links.length === 0 && (
            <div className="text-[8px] text-center py-4 opacity-75" style={{ color: t.sub }}>No links yet 🐮</div>
          )}
        </div>
        <div className="mt-auto pt-3 pb-1 text-[7.5px] font-medium flex items-center gap-0.5 opacity-80" style={{ color: t.sub }}>
          <span>🐮</span> MooLink
        </div>
      </div>
      <div className="flex justify-center pb-1.5 bg-zinc-900">
        <div className="w-20 h-1 bg-zinc-600 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-bold text-base shadow-inner">
                {(displayName || username).charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  Profile Info
                  {profile.is_pro && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      <Sparkles className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">Customize how visitors see your page</CardDescription>
              </div>
            </div>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/80 font-medium transition-colors w-fit"
            >
              {typeof window !== 'undefined' ? window.location.origin : ''}/{profile.username} <ExternalLink className="w-3 h-3" />
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
                    onChange={(e) => setUsername(e.target.value)}
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
                    {profileMessage.type === 'success' && <ShieldCheck className="w-3.5 h-3.5" />}
                    {profileMessage.text}
                  </div>
                )}
              </div>
              {hasProfileChanges && (
                <Button type="submit" size="sm" disabled={loading} className="bg-amber-800 hover:bg-amber-900 text-white font-medium gap-1.5 px-4 shadow-sm">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme + Live Preview Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Theme Picker (3 columns) */}
        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Paintbrush className="w-4 h-4 text-amber-700" /> Themes
                </CardTitle>
                <CardDescription className="text-xs">Choose a style for your public link page</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                {themeMessage && <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-200 animate-in fade-in">{themeMessage}</span>}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-lg w-fit mt-3">
              <button
                type="button"
                onClick={() => setThemeCategory('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  themeCategory === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All (18)
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredThemes.map(([id, th]) => {
                const isActive = theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleThemeChange(id)}
                    disabled={saving}
                    className={`relative text-left p-3 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                      isActive
                        ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-md scale-[1.02]'
                        : 'border-border/60 hover:border-border hover:scale-[1.01]'
                    }`}
                    style={{ background: th.bg }}
                  >
                    {/* Visual Card Elements Mock */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/30 shadow-sm flex items-center justify-center" style={{ backgroundColor: th.accent }}>
                        {isActive && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <div className="h-1 flex-1 rounded-full opacity-30" style={{ backgroundColor: th.text }} />
                    </div>

                    <div className="p-1.5 rounded-lg border text-[9px] font-medium truncate mb-2 opacity-90 shadow-2xs"
                      style={{
                        background: th.cardBg || th.card,
                        borderColor: th.border,
                        color: th.text,
                      }}
                    >
                      Sample Link
                    </div>

                    <div className="text-[11px] font-bold tracking-tight truncate" style={{ color: th.text }}>
                      {th.name}
                    </div>

                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
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
    </div>
  );
}

