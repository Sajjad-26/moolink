-- App-install attribution links go through moolink.xyz/app/<app>?ref=<creator>,
-- which has no corresponding row in `links` (it's a generated install route).
-- Allow click_events to be recorded without a link_id, and tag the app that
-- was promoted so analytics are accurate.
alter table public.click_events alter column link_id drop not null;
alter table public.click_events add column if not exists app_slug text;
