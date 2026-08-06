-- Analytics upgrade: page_views + referrers
-- Run this in Supabase SQL Editor

-- Add referrer column to click_events
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Page views table
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  country TEXT,
  device_type TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_profile_id ON public.page_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(profile_id, created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (visitors)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- Profile owners can read their own page views
CREATE POLICY "Users can view own page views"
  ON public.page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = page_views.profile_id
      AND profiles.user_id = auth.uid()
    )
  );
