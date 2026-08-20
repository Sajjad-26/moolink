-- Per-creator commission rate (admin-set), e.g. 0.30 = 30%, 0.35 = 35%
-- NULL = not set (treated as 0 until the admin assigns a rate)
alter table public.profiles add column if not exists commission_rate numeric(5,4);
