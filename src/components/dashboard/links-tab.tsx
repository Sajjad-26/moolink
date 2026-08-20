'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { detectIconFromUrl } from '@/lib/detect-icon';
import { GripVertical, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink, Link2, Sparkles, Loader2, Check, Download, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Link as LinkType } from '@/lib/types';
import { THEMES, getTheme, type ThemeId } from '@/lib/themes';
import { getSocialConfig } from '@/lib/icons';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export function LinksTab({ profile, isPro = true }: { profile: Profile; isPro?: boolean }) {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [adding, setAdding] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const supabase = createClient();
  const theme = getTheme(profile.theme);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .order('order_index', { ascending: true });
    setLinks(data || []);
  };

  useEffect(() => {
    setMounted(true);
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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLinks(items);
    await reorderLinks(items.map((l) => l.id));
  };

  const renderLinkList = () => {
    if (!mounted) {
      return (
        <div className="space-y-2.5">
          {links.map((link, index) => renderLinkItem(link, index))}
        </div>
      );
    }

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="links-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2.5"
            >
              {links.map((link, index) => (
                <Draggable key={link.id} draggableId={link.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-shadow rounded-xl ${snapshot.isDragging ? 'shadow-lg ring-2 ring-amber-500/50 z-50' : ''}`}
                    >
                      {renderLinkItem(link, index, provided.dragHandleProps)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  const renderLinkItem = (link: LinkType, index: number, dragHandleProps?: any) => {
    const social = getSocialConfig(link.icon);
    return (
      <div
        className={`flex items-center gap-3 p-3.5 bg-card rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-sm ${
          link.is_active ? 'border-border hover:border-amber-400/80' : 'border-border/50 opacity-60 bg-muted/30'
        }`}
      >
        {/* Drag Handle Icon */}
        <div
          {...dragHandleProps}
          className="p-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
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
              const prevActive = link.is_active;
              setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: checked } : l)));
              const result = await updateLink(link.id, { is_active: checked });
              if (result?.error) {
                setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: prevActive } : l)));
              }
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
            onClick={() => setDeleteTarget({ id: link.id, title: link.title })}
            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Link Editor Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Manage Links
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Drag or reorder links to change<br />priority on your public page
            </p>
          </div>
          {!adding && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                className="gap-1.5 border-amber-800/30 text-amber-950 dark:text-amber-200 hover:bg-amber-100/50 font-bold text-xs shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Import Links
              </Button>
              <Button
                size="sm"
                onClick={() => setAdding(true)}
                className="gap-2 bg-amber-800 hover:bg-amber-900 text-white font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Link
              </Button>
            </div>
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
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-5">
              Switching from Linktree or starting fresh? Add your website, social media, or import existing links in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="gap-2 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-black text-white font-bold text-xs h-9 px-5 rounded-xl shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Import from Linktree / Any Bio
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAdding(true)}
                className="gap-2 font-semibold text-xs h-9 px-5 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" /> Add Manually
              </Button>
            </div>
          </Card>
        )}

        {renderLinkList()}
      </div>

      {/* Sticky Live Phone Mock Preview */}
      <div className="sticky top-16 h-fit hidden lg:block">
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
              <span>Live Preview</span>
              <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-medium">
                {links.filter((l) => l.is_active).length} links
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-0 pb-4 px-4">
            <div className="border-[5px] border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl max-w-[190px] w-full">
              {/* Phone Notch */}
              <div className="flex justify-center bg-zinc-900 py-1">
                <div className="w-[44px] h-3 bg-black rounded-full relative">
                  <div className="absolute right-1.5 top-1 w-1 h-1 rounded-full bg-zinc-700" />
                </div>
              </div>

              {/* Screen */}
              <div
                className="min-h-[340px] flex flex-col items-center px-2.5 pt-3 pb-2 bg-no-repeat"
                style={{
                  background: theme.bg,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Avatar */}
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shadow-md ring-2 ring-white/20"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white/20"
                    style={{ backgroundColor: theme.accent, color: theme.accentText }}
                  >
                    {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className="mt-1 font-bold text-[9px] text-center px-1 truncate max-w-full"
                  style={{
                    color: theme.text,
                    textShadow: theme.text === '#FFFFFF' || theme.text.toLowerCase().includes('fff')
                      ? '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.4)'
                      : '0 1px 2px rgba(255,255,255,0.9), 0 0 1px rgba(255,255,255,1)',
                  }}
                >
                  {profile.display_name || profile.username}
                </div>
                {profile.bio && (
                  <div
                    className="mt-0.5 text-[7px] text-center leading-tight px-1 line-clamp-2 text-white font-medium"
                    style={{
                      color: '#FFFFFF',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {profile.bio}
                  </div>
                )}

                {/* Links */}
                <div className="w-full mt-2 space-y-1 flex-1">
                  {links.filter((l) => l.is_active).length > 0 ? (
                    links.filter((l) => l.is_active).map((link) => {
                      const social = getSocialConfig(link.icon);
                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg ios-liquid-glass text-[7px] font-semibold text-black"
                          style={{ color: '#000000' }}
                        >
                          {social ? (
                            <span
                              className="inline-flex items-center justify-center w-3 h-3 flex-shrink-0"
                              dangerouslySetInnerHTML={{
                                __html: social.svg
                                  .replace(/width="\d+"/g, 'width="10"')
                                  .replace(/height="\d+"/g, 'height="10"'),
                              }}
                            />
                          ) : (
                            <span className="text-[8px]">{getIcon(link.icon)}</span>
                          )}
                          <span className="truncate flex-1">{link.title}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-1">
                      {['Visit my website', 'Follow on Instagram', 'Check my YouTube'].map((placeholder, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg ios-liquid-glass text-[7px] font-medium text-black opacity-80"
                          style={{ color: '#000000' }}
                        >
                          <span className="text-[8px]">{['🔗', '📸', '🎬'][i]}</span>
                          <span className="truncate">{placeholder}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Branding */}
                {!isPro && (
                  <div
                    className="mt-1.5 text-[6px] font-medium flex items-center gap-0.5"
                    style={{ color: theme.sub || theme.text, opacity: 0.7 }}
                  >
                    🐮 MooLink
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The link will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (deleteTarget) {
                  await deleteLink(deleteTarget.id);
                  setDeleteTarget(null);
                  fetchLinks();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Import Links Modal */}
      {importModalOpen && (
        <ImportLinksModal
          onClose={() => setImportModalOpen(false)}
          onSaved={handleSave}
        />
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

  const [error, setError] = useState('');

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const detected = detectIconFromUrl(newUrl);
    setIcon(detected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('title', title);
    form.append('url', url);
    form.append('icon', icon);
    const result = await addLink(form);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
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
        {error && <p className="text-xs text-destructive font-medium flex-1 self-center">{error}</p>}
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
  const [error, setError] = useState('');

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const detected = detectIconFromUrl(newUrl);
    setIcon(detected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await updateLink(link.id, { title, url, icon });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
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

function ImportLinksModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const controller = new AbortController();
    const clientTimeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      clearTimeout(clientTimeout);
      const res = await response.json();

      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(`Successfully imported ${res.importedCount} ${res.importedCount === 1 ? 'link' : 'links'}!`);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      }
    } catch {
      clearTimeout(clientTimeout);
      setError('Request timed out. The site might be blocking imports. Please add your links manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" /> Import from Linktree or Bio Link
          </DialogTitle>
          <DialogDescription className="text-xs">
            Paste your Linktree, Beacons, or existing bio page URL to import all your links in 1 click.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">{error}</p>}
          {success && <p className="text-xs text-emerald-800 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-bold flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> {success}</p>}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Your Linktree or Bio Page URL</Label>
            <Input
              placeholder="e.g. linktr.ee/alex or beacons.ai/username"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="h-10 text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !url.trim()} className="bg-amber-800 hover:bg-amber-900 text-white font-medium gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {loading ? 'Scanning & Importing...' : 'Import Links'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

