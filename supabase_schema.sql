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
  theme text not null default 'classic-moo',
  is_pro boolean not null default false,
  dodo_subscription_id text,
  subscription_status text default 'inactive',
  is_affiliate boolean not null default false,
  is_admin boolean not null default false,
  commission_rate numeric(5,4),
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
  link_id uuid references public.links(id) on delete cascade,  -- nullable (app-install links have no links row)
  profile_id uuid references public.profiles(id) on delete cascade not null,
  app_slug text,                                                 -- which app was promoted (facera, ...), nullable
  country text,
  device_type text,
  referrer text,
  created_at timestamptz not null default now()
);

-- Add referrer / app_slug columns if table already existed without them
alter table public.click_events add column if not exists referrer text;
alter table public.click_events add column if not exists app_slug text;
alter table public.click_events alter column link_id drop not null;

-- ============================================================
-- PAGE VIEWS TABLE
-- ============================================================
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  country text,
  device_type text,
  referrer text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- COMMISSION PERIODS TABLE (affiliate revenue pool)
-- ============================================================
create table if not exists public.commission_periods (
  id uuid primary key default gen_random_uuid(),
  period text not null unique,             -- 'YYYY-MM' (UTC month)
  revenue_proceeds numeric(12,2) not null default 0,
  revenue_gross numeric(12,2) not null default 0,
  currency text not null default 'USD',
  commission_rate numeric(5,4) not null default 0.35,
  total_pool numeric(12,2) not null default 0,  -- proceeds * rate
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AFFILIATE SALES TABLE (RevenueCat attributed sales)
-- ============================================================
create table if not exists public.affiliate_sales (
  id uuid primary key default gen_random_uuid(),
  rc_event_id text unique not null,          -- RevenueCat webhook event id (idempotency)
  profile_id uuid references public.profiles(id) on delete cascade,  -- the credited affiliate (nullable if ref unknown)
  ref text,                                   -- raw affiliate_ref stamped on the subscriber
  app_user_id text,                           -- RevenueCat customer id
  event_type text not null,                   -- INITIAL_PURCHASE | RENEWAL | ...
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  proceeds numeric(12,2) not null default 0,
  commission numeric(12,2) not null default 0,
  period text not null,                       -- 'YYYY-MM' UTC month of the sale
  payout_status text not null default 'pending', -- 'pending' | 'paid'
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Add payout_status if table already existed
alter table public.affiliate_sales add column if not exists payout_status text not null default 'pending';

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
create index if not exists idx_page_views_profile_id on public.page_views(profile_id);
create index if not exists idx_page_views_created_at on public.page_views(profile_id, created_at desc);

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

-- Page Views RLS
alter table public.page_views enable row level security;

-- Anyone can insert page views (visitors)
create policy "Anyone can insert page views"
  on public.page_views for insert
  with check (true);

-- Profile owners can read their own page views
create policy "Users can view own page views"
  on public.page_views for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = page_views.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Commission Periods RLS
alter table public.commission_periods enable row level security;

-- Only admins can read commission periods (owner-only payout data)
create policy "commission_periods admin select"
  on public.commission_periods for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- No insert/update/delete policies: writes only via service role (server actions)

-- Affiliate Sales RLS
alter table public.affiliate_sales enable row level security;

-- Only admins can read attributed sales
create policy "affiliate_sales admin select"
  on public.affiliate_sales for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- No insert/update/delete policies: writes only via service role (webhook)

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  unique_username text;
  raw_name text;
  raw_avatar text;
begin
  -- Get Google / OAuth metadata if available
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Creator'
  );
  
  raw_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  -- Generate clean username from email prefix
  unique_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if unique_username = '' then
    unique_username := 'creator';
  end if;

  -- If username taken, append short number suffix
  while exists (select 1 from public.profiles where username = unique_username) loop
    unique_username := unique_username || floor(random() * 90 + 10)::text;
  end loop;

  insert into public.profiles (user_id, username, display_name, avatar_url)
  values (new.id, unique_username, raw_name, raw_avatar);

  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ADMIN SETTINGS TABLE (Global config)
-- ============================================================
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null
);

-- Enable RLS and deny access to all by default (Service Role will bypass this)
alter table public.admin_settings enable row level security;

insert into public.admin_settings (key, value)
values ('default_commission_rate', '"0.30"')
on conflict (key) do nothing;

-- ============================================================
-- ARCHIVE CREATORS
-- ============================================================
alter table public.profiles add column if not exists is_archived boolean not null default false;
