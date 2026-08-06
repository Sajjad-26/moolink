-- MooLink - Link-in-Bio SaaS Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  theme text not null default 'default',
  is_pro boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- LINKS TABLE
-- ============================================================
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  url text not null,
  icon text not null default 'link',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CLICK EVENTS TABLE
-- ============================================================
create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.links(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  country text,
  device_type text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_links_profile_id on public.links(profile_id);
create index if not exists idx_links_order_index on public.links(profile_id, order_index);
create index if not exists idx_click_events_link_id on public.click_events(link_id);
create index if not exists idx_click_events_profile_id on public.click_events(profile_id);
create index if not exists idx_click_events_created_at on public.click_events(profile_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles RLS
alter table public.profiles enable row level security;

-- Anyone can read a profile by username (public page)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can insert their own profile
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Links RLS
alter table public.links enable row level security;

-- Anyone can read active links of any profile (public page)
create policy "Anyone can view active links"
  on public.links for select
  using (is_active = true);

-- Users can manage their own links (CRUD via profile ownership)
create policy "Users can insert own links"
  on public.links for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
    )
  );

create policy "Users can update own links"
  on public.links for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
    )
  );

create policy "Users can delete own links"
  on public.links for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = links.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Click Events RLS
alter table public.click_events enable row level security;

-- Anyone can insert click events (anonymous visitors)
create policy "Anyone can insert click events"
  on public.click_events for insert
  with check (true);

-- Only profile owners can read their own click events (dashboard analytics)
create policy "Users can view own click events"
  on public.click_events for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = click_events.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  unique_username text;
begin
  -- Generate unique username from email or random
  unique_username := coalesce(
    split_part(new.email, '@', 1),
    'user'
  );

  -- If username taken, append random suffix
  while exists (select 1 from public.profiles where username = unique_username) loop
    unique_username := unique_username || '-' || substring(gen_random_uuid()::text from 1 for 4);
  end loop;

  insert into public.profiles (user_id, username, display_name)
  values (new.id, unique_username, unique_username);

  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
