'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Link } from '@/lib/types';

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return profile;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const displayName = formData.get('display_name') as string;
  const bio = formData.get('bio') as string;
  let username = formData.get('username') as string;
  const theme = formData.get('theme') as string | null;
  const avatarUrl = formData.get('avatar_url') as string | null;

  username = (username || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
  if (!username || username.length < 3) {
    return { error: 'Username must be at least 3 characters and contain only letters, numbers, hyphens, or underscores.' };
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio,
      username,
      theme: theme || 'classic-moo',
      avatar_url: avatarUrl || null,
    })
    .eq('user_id', user.id);

  if (error) {
    if (error.code === '23505') return { error: 'Username already taken' };
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  if (currentProfile?.username && currentProfile.username !== username) {
    revalidatePath(`/${currentProfile.username}`);
  }
  revalidatePath(`/${username}`);
  return { success: true };
}

export async function updateTheme(theme: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, created_at, username')
    .eq('user_id', user.id)
    .single();

  if (!profile) return { error: 'Profile not found' };

  const isPro = profile.is_pro || (() => {
    if (!profile.created_at) return false;
    return (Date.now() - new Date(profile.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000;
  })();

  const isProTheme = theme.startsWith('nature-') || theme.startsWith('http');
  if (isProTheme && !isPro) {
    return { error: 'Premium themes require Pro. Upgrade to unlock!' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  if (profile.username) revalidatePath(`/${profile.username}`);
  return { success: true };
}

export async function isProfilePro(profile: { is_pro?: boolean | null; created_at?: string | null } | null): Promise<boolean> {
  if (!profile) return false;
  if (profile.is_pro) return true;
  if (profile.created_at) {
    const ageInMs = Date.now() - new Date(profile.created_at).getTime();
    if (ageInMs <= 7 * 24 * 60 * 60 * 1000) return true;
  }
  return false;
}

export async function addLink(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, is_pro, created_at')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const isPro = await isProfilePro(profile);
  if (!isPro) {
    const { count } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id);

    if ((count || 0) >= 3) {
      return { error: 'Free plan is limited to 3 links. Upgrade to Pro for unlimited links!' };
    }
  }

  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const icon = formData.get('icon') as string;

  const { data: lastLink } = await supabase
    .from('links')
    .select('order_index')
    .eq('profile_id', profile.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (lastLink?.order_index ?? -1) + 1;

  const { error } = await supabase.from('links').insert({
    profile_id: profile.id,
    title,
    url,
    icon,
    order_index: nextIndex,
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  if (profile.username) revalidatePath(`/${profile.username}`);
  return { success: true };
}

export async function updateLink(id: string, data: Partial<Pick<Link, 'title' | 'url' | 'icon' | 'is_active' | 'order_index'>>) {
  const supabase = await createClient();
  const { error } = await supabase.from('links').update(data).eq('id', id);
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).single();
    if (profile?.username) revalidatePath(`/${profile.username}`);
  }
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteLink(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('links').delete().eq('id', id);
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).single();
    if (profile?.username) revalidatePath(`/${profile.username}`);
  }
  revalidatePath('/dashboard');
  return { success: true };
}

export async function reorderLinks(orderedIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return { error: 'Profile not found' };

  const { error } = await supabase.from('links').upsert(
    orderedIds.map((id, index) => ({
      id,
      profile_id: profile.id,
      order_index: index,
    })),
    { onConflict: 'id' }
  );

  if (error) return { error: error.message };

  const { data: userProfile } = await supabase.from('profiles').select('username').eq('user_id', user.id).single();
  if (userProfile?.username) revalidatePath(`/${userProfile.username}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getLinks(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('links')
    .select('*')
    .eq('profile_id', profileId)
    .order('order_index', { ascending: true });

  return data || [];
}
