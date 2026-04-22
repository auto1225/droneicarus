-- Migration 0009 — External hosting links for pilot uploads
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/eotsbncgkgewgbemaarp/sql/new

BEGIN;

-- 1. videos table — pilot-hosted external URL columns
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS external_url          text,
  ADD COLUMN IF NOT EXISTS external_provider     text,
  ADD COLUMN IF NOT EXISTS external_size_bytes   bigint,
  ADD COLUMN IF NOT EXISTS external_checked_at   timestamptz,
  ADD COLUMN IF NOT EXISTS external_check_status text;  -- 'ok' | 'broken' | 'pending'

CREATE INDEX IF NOT EXISTS idx_videos_external_provider
  ON public.videos (external_provider)
  WHERE external_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_external_check_status
  ON public.videos (external_check_status)
  WHERE external_check_status IS NOT NULL;

COMMENT ON COLUMN public.videos.external_url IS
  'Direct URL when pilot hosts the master elsewhere (Dropbox/Vimeo/GDrive/Frame.io). Mutually exclusive with storage_path.';
COMMENT ON COLUMN public.videos.external_provider IS
  'One of: dropbox, gdrive, vimeo, frame-io, wetransfer, other';
COMMENT ON COLUMN public.videos.external_check_status IS
  'Health check result: ok | broken | pending';

-- 2. download_events — chargeback defense + analytics log (per-download row)
CREATE TABLE IF NOT EXISTS public.download_events (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid,                      -- buyer's order reference
  video_id        uuid references public.videos(id) on delete set null,
  buyer_id        uuid references auth.users(id)   on delete set null,
  ip_address      text,
  user_agent      text,
  bytes_delivered bigint,
  http_status     smallint,
  started_at      timestamptz default now(),
  completed_at    timestamptz,
  notes           text
);

CREATE INDEX IF NOT EXISTS idx_download_events_video      ON public.download_events (video_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_events_buyer      ON public.download_events (buyer_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_events_order      ON public.download_events (order_id);

ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own download events
CREATE POLICY "buyers read own events" ON public.download_events
  FOR SELECT USING (buyer_id = auth.uid());

-- Admins full access
CREATE POLICY "admins read all events" ON public.download_events
  FOR SELECT USING (public.is_admin());

-- Service role (backend) can insert
CREATE POLICY "service inserts events" ON public.download_events
  FOR INSERT WITH CHECK (true);

-- 3. orders table — add cache fields for the R2 just-in-time copy
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cached_url       text,
  ADD COLUMN IF NOT EXISTS cache_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS single_download_agreed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS download_count   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_download_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_download_at  timestamptz;

COMMENT ON COLUMN public.orders.cached_url IS
  'R2 cache path for just-in-time copy of external-hosted file. Expires after cache_expires_at.';
COMMENT ON COLUMN public.orders.single_download_agreed IS
  'Buyer explicitly agreed to the one-time download policy at checkout (legal evidence).';

COMMIT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='videos'
  AND column_name LIKE 'external%';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='orders'
  AND (column_name LIKE 'cached%' OR column_name LIKE 'download%' OR column_name = 'single_download_agreed');
