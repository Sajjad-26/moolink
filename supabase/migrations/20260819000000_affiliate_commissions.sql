-- Add affiliate/admin flags to profiles
alter table public.profiles add column if not exists is_affiliate boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Commission periods: one row per month storing the fetched RevenueCat numbers and payout state
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

-- RLS: commission periods are only visible to admins (the owner)
alter table public.commission_periods enable row level security;

create policy "commission_periods admin select"
  on public.commission_periods for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.is_admin = true
    )
  );

-- No insert/update/delete policies: writes only via service role (server actions)
