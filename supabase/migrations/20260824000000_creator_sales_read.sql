-- Creators need to read their own affiliate_sales so they can subscribe to them
-- over Supabase Realtime and get in-app notifications when they earn, and so the
-- client can render their transaction list. They already see this data via the
-- dashboard server actions, so this is not a new privilege — just exposes the
-- same rows over the realtime channel.
create policy "affiliate_sales creator select own"
  on public.affiliate_sales for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = affiliate_sales.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Admin keep-all policy already exists; realtime INSERT broadcasts to the admin
-- channel when filtered by their elevated role.
