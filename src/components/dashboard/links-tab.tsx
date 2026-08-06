'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from '@/app/dashboard/actions';
import { getIcon, getIconKeys } from '@/lib/icons';
import { GripVertical, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink, Link2, Sparkles, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Link as LinkType } from '@/lib/types';
import { THEMES, type ThemeId } from '@/lib/themes';
import { getSocialConfig } from '@/lib/icons';

function detectIconFromUrl(url: string): string {
  if (!url) return 'link';
  const lower = url.toLowerCase().trim();
  if (lower.includes('play.google.com') || lower.includes('playstore') || lower.includes('google.play')) return 'playstore';
  if (lower.includes('apps.apple.com') || lower.includes('itunes.apple.com') || lower.includes('appstore')) return 'appstore';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('github.com')) return 'github';
  if (lower.includes('linkedin.com')) return 'linkedin';
  if (lower.includes('discord.gg') || lower.includes('discord.com')) return 'discord';
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('spotify.com')) return 'spotify';
  if (lower.includes('t.me') || lower.includes('telegram.me') || lower.includes('telegram.org')) return 'telegram';
  if (lower.includes('wa.me') || lower.includes('whatsapp.com')) return 'whatsapp';
  if (lower.includes('facebook.com') || lower.includes('fb.me')) return 'facebook';
  if (lower.includes('reddit.com')) return 'reddit';
  if (lower.includes('threads.net')) return 'threads';
  if (lower.includes('substack.com')) return 'substack';
  if (lower.includes('patreon.com')) return 'patreon';
  if (lower.includes('mailto:')) return 'email';
  if (lower.includes('store') || lower.includes('shop')) return 'store';
  return 'link';
}

export function LinksTab({ profile }: { profile: Profile }) {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [adding, setAdding] = useState(false);
  const supabase = createClient();
  const theme = THEMES[(profile.theme as ThemeId) || 'classic-moo'] || THEMES['classic-moo'];

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .order('order_index', { ascending: true });
    setLinks(data || []);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSave = async () => {
    fetchLinks();
    setAdding(false);
    setEditingLink(null);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    setLinks(newLinks);

    await reorderLinks(newLinks.map((l) => l.id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Link Editor Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5 text-amber-700" /> Manage Links
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Drag or order links to change priority on your page</p>
          </div>
          {!adding && (
            <Button
              size="sm"
              onClick={() => setAdding(true)}
              className="gap-2 bg-amber-800 hover:bg-amber-900 text-white font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Link
            </Button>
          )}
        </div>

        {/* Add Link Form */}
        {adding && (
          <AddLinkForm
            profileId={profile.id}
            onClose={() => setAdding(false)}
            onSaved={handleSave}
          />
        )}

        {/* Links List */}
        {links.length === 0 && !adding && (
          <Card className="border-dashed border-2 border-border p-12 text-center shadow-none">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 text-2xl">
              🐮
            </div>
            <h3 className="font-bold text-base text-foreground">No links added yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Add your website, social media, store, or portfolio links to start building your public profile.
            </p>
            <Button
              size="sm"
              onClick={() => setAdding(true)}
              className="mt-4 gap-2 bg-amber-800 hover:bg-amber-900 text-white font-medium"
            >
              <Plus className="w-4 h-4" /> Add Your First Link
            </Button>
          </Card>
        )}

        <div className="space-y-2.5">
          {links.map((link, index) => {
            const social = getSocialConfig(link.icon);
            return (
              <div
                key={link.id}
                className={`flex items-center gap-3 p-3.5 bg-card rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-sm ${
                  link.is_active ? 'border-border hover:border-amber-400/80' : 'border-border/50 opacity-60 bg-muted/30'
                }`}
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === links.length - 1}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Icon Badge */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {social ? (
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md"
                      dangerouslySetInnerHTML={{
                        __html: social.svg
                          .replace(/width="\d+"/g, 'width="24"')
                          .replace(/height="\d+"/g, 'height="24"'),
                      }}
                    />
                  ) : (
                    <span className="text-xl">{getIcon(link.icon)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate flex items-center gap-2">
                    {link.title}
                    {!link.is_active && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground font-semibold">Hidden</span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-amber-700 truncate block transition-colors mt-0.5"
                  >
                    {link.url}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={async (checked) => {
                      await updateLink(link.id, { is_active: checked });
                      fetchLinks();
                    }}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingLink(link)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await deleteLink(link.id);
                      fetchLinks();
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Live Phone Mock Preview */}
      <div className="sticky top-20 h-fit">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Live Phone Preview</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                {links.filter((l) => l.is_active).length} Active Links
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-[6px] border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl max-w-[250px] mx-auto transition-all">
              {/* Phone Notch */}
              <div className="flex justify-center bg-zinc-900 py-1.5">
                <div className="w-[60px] h-4 bg-black rounded-full relative flex items-center justify-end pr-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                </div>
              </div>

              {/* Profile Page Mock */}
              <div className="min-h-[460px] flex flex-col items-center p-3.5" style={{ background: theme.bg }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-md ring-2 ring-white/20"
                  style={{ backgroundColor: theme.accent, color: theme.accentText }}
                >
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </div>
                <div className="mt-2 font-bold text-[10px] text-center px-3" style={{ color: theme.text }}>
                  {profile.display_name || profile.username}
                </div>
                {profile.bio && (
                  <div className="mt-0.5 text-[9px] text-center leading-tight px-3 line-clamp-2 opacity-85" style={{ color: theme.sub }}>
                    {profile.bio}
                  </div>
                )}
                <div className="w-full mt-3 space-y-1.5 flex-1">
                  {links.filter((l) => l.is_active).map((link) => {
                    const social = getSocialConfig(link.icon);
                    return (
                      <div
                        key={link.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] shadow-sm transition-all"
                        style={{
                          background: theme.cardBg || theme.card,
                          backdropFilter: theme.backdropFilter || 'none',
                          WebkitBackdropFilter: theme.backdropFilter || 'none',
                          borderColor: theme.border,
                          color: theme.text,
                        }}
                      >
                        {social ? (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-md flex-shrink-0"
                            dangerouslySetInnerHTML={{
                              __html: social.svg
                                .replace(/width="\d+"/g, 'width="16"')
                                .replace(/height="\d+"/g, 'height="16"'),
                            }}
                          />
                        ) : (
                          <span className="text-[11px] flex-shrink-0">{getIcon(link.icon)}</span>
                        )}
                        <span className="font-medium truncate flex-1">{link.title}</span>
                      </div>
                    );
                  })}
                  {links.filter((l) => l.is_active).length === 0 && (
                    <div className="text-[9px] text-center py-6 opacity-75" style={{ color: theme.sub }}>
                      No active links yet 🐮
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-3 pb-1 text-[8px] font-medium flex items-center gap-0.5 opacity-80" style={{ color: theme.sub }}>
                  <span>🐮</span> MooLink
                </div>
              </div>
              <div className="flex justify-center pb-1.5 bg-zinc-900">
                <div className="w-24 h-1 bg-zinc-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Link Modal */}
      {editingLink && (
        <Dialog open onOpenChange={() => setEditingLink(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-700" /> Edit Link
              </DialogTitle>
              <DialogDescription className="text-xs">Update your link details and icon</DialogDescription>
            </DialogHeader>
            <EditLinkForm
              link={editingLink}
              onClose={() => setEditingLink(null)}
              onSaved={handleSave}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddLinkForm({
  profileId,
  onClose,
  onSaved,
}: {
  profileId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('link');
  const [loading, setLoading] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const detected = detectIconFromUrl(newUrl);
    setIcon(detected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData();
    form.append('title', title);
    form.append('url', url);
    form.append('icon', icon);
    await addLink(form);
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card rounded-xl border-2 border-amber-400/80 shadow-md space-y-3.5">
      <div className="border-b border-border/50 pb-2">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-amber-700" /> Add New Link
        </h3>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Destination URL</Label>
        <Input
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://play.google.com/store/apps/... or https://instagram.com/..."
          required
          className="text-sm h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Link Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Get on Play Store / My Instagram"
          required
          className="text-sm h-9"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading} className="bg-amber-800 hover:bg-amber-900 text-white font-medium gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Add Link
        </Button>
      </div>
    </form>
  );
}

function EditLinkForm({
  link,
  onClose,
  onSaved,
}: {
  link: LinkType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [icon, setIcon] = useState(link.icon);
  const [loading, setLoading] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const detected = detectIconFromUrl(newUrl);
    setIcon(detected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateLink(link.id, { title, url, icon });
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">URL</Label>
        <Input value={url} onChange={(e) => handleUrlChange(e.target.value)} required className="h-9 text-sm" />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading} className="bg-amber-800 hover:bg-amber-900 text-white font-medium gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Changes
        </Button>
      </div>
    </form>
  );
}

