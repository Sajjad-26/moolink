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
  const username = formData.get('username') as string;
  const theme = formData.get('theme') as string | null;

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, bio, username, theme: theme || 'classic-moo' })
    .eq('user_id', user.id);

  if (error) {
    if (error.code === '23505') return { error: 'Username already taken' };
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/${username}`);
  return { success: true };
}

export async function addLink(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const icon = formData.get('icon') as string;

  // Get next order index
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
  revalidatePath(`/${user.id}`);
  return { success: true };
}

export async function updateLink(id: string, data: Partial<Pick<Link, 'title' | 'url' | 'icon' | 'is_active' | 'order_index'>>) {
  const supabase = await createClient();
  const { error } = await supabase.from('links').update(data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteLink(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('links').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

export async function reorderLinks(orderedIds: string[]) {
  const supabase = await createClient();
  const updates = orderedIds.map((id, index) => ({
    id,
    order_index: index,
    updated_at: new Date().toISOString(),
  }));

  for (const update of updates) {
    await supabase
      .from('links')
      .update({ order_index: update.order_index })
      .eq('id', update.id);
  }

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
