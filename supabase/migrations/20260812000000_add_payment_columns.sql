-- Add payment/subscription columns to profiles table
-- These are needed for Dodo Payments webhook integration

alter table public.profiles add column if not exists dodo_subscription_id text;
alter table public.profiles add column if not exists subscription_status text default 'inactive';
