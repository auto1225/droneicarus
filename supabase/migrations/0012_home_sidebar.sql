-- Migration 0012 — Home page right sidebar (hot videos / live / ads)
-- Run ONCE in Supabase Dashboard → SQL Editor

BEGIN;

-- 1. home_sidebar_picks — curated slots for the right rail
CREATE TABLE IF NOT EXISTS public.home_sidebar_picks (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('hot','live','ad')),
  ref_id      uuid,                   -- videos.id for hot/live
  payload     jsonb default '{}'::jsonb, -- ad: {title,image_url,click_url,brand,cta}
  sort_order  int default 100,
  active      boolean default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_picks_kind_active ON public.home_sidebar_picks(kind, active, sort_order);

-- 2. live_streams — pilots' live broadcasts (independent or YT-mirrored)
CREATE TABLE IF NOT EXISTS public.live_streams (
  id              uuid primary key default gen_random_uuid(),
  pilot_id        uuid references auth.users(id) on delete set null,
  title           text not null,
  description     text,
  thumb_url       text,
  status          text default 'scheduled' check (status in ('scheduled','live','ended')),
  scheduled_at    timestamptz,
  started_at      timestamptz,
  ended_at        timestamptz,
  yt_video_id     text,                  -- if pilot is also live on YouTube
  yt_channel_id   text,
  embed_provider  text default 'site',   -- 'site' | 'youtube'
  viewers_peak    int default 0,
  super_chat_total_usd numeric(10,2) default 0,
  lat             double precision,
  lon             double precision,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status, scheduled_at DESC);

-- 3. live_chat_messages — realtime chat (Supabase Realtime channel)
CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  stream_id   uuid not null references public.live_streams(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  username    text,                       -- denormalised for guest msgs
  body        text not null check (length(body) <= 500),
  is_super    boolean default false,
  super_amount_usd numeric(10,2),
  super_color text,                       -- 'blue'|'lblue'|'green'|'yellow'|'orange'|'pink'|'red' (YT tiers)
  super_pin_seconds int default 0,
  created_at  timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_chat_stream_time ON public.live_chat_messages(stream_id, created_at DESC);

-- 4. super_chats — financial ledger with 85:15 split
CREATE TABLE IF NOT EXISTS public.super_chats (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid references public.live_chat_messages(id) on delete set null,
  stream_id       uuid not null references public.live_streams(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  amount_usd      numeric(10,2) not null check (amount_usd > 0),
  pilot_share_usd numeric(10,2) not null,        -- 85%
  platform_fee_usd numeric(10,2) not null,       -- 15%
  paypal_order_id text,
  status          text default 'paid' check (status in ('pending','paid','refunded','failed')),
  created_at      timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_super_chats_pilot_paid ON public.super_chats(stream_id, status);

-- 5. ads — manageable ads pool (joined with home_sidebar_picks via ref_id-less rows)
CREATE TABLE IF NOT EXISTS public.ads (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  brand       text,
  image_url   text,
  click_url   text,
  cta_label   text default 'Learn more',
  active      boolean default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  impressions int default 0,
  clicks      int default 0,
  created_at  timestamptz default now()
);

-- 6. RLS
ALTER TABLE public.home_sidebar_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_chats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads                ENABLE ROW LEVEL SECURITY;

-- Public reads where active
DROP POLICY IF EXISTS "public reads picks" ON public.home_sidebar_picks;
CREATE POLICY "public reads picks" ON public.home_sidebar_picks
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "public reads live" ON public.live_streams;
CREATE POLICY "public reads live" ON public.live_streams
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public reads chat" ON public.live_chat_messages;
CREATE POLICY "public reads chat" ON public.live_chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public reads ads" ON public.ads;
CREATE POLICY "public reads ads" ON public.ads
  FOR SELECT USING (active = true);

-- Auth users can post chat
DROP POLICY IF EXISTS "auth posts chat" ON public.live_chat_messages;
CREATE POLICY "auth posts chat" ON public.live_chat_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Pilots can manage their own streams
DROP POLICY IF EXISTS "pilot manages streams" ON public.live_streams;
CREATE POLICY "pilot manages streams" ON public.live_streams
  FOR ALL USING (pilot_id = auth.uid()) WITH CHECK (pilot_id = auth.uid());

-- Admin can manage everything (re-uses public.is_admin())
DROP POLICY IF EXISTS "admin all picks" ON public.home_sidebar_picks;
CREATE POLICY "admin all picks" ON public.home_sidebar_picks
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin all live" ON public.live_streams;
CREATE POLICY "admin all live" ON public.live_streams
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin all chat" ON public.live_chat_messages;
CREATE POLICY "admin all chat" ON public.live_chat_messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin all super" ON public.super_chats;
CREATE POLICY "admin all super" ON public.super_chats
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin all ads" ON public.ads;
CREATE POLICY "admin all ads" ON public.ads
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. Realtime publication for chat (so Supabase Realtime can broadcast inserts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

COMMIT;

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN
  ('home_sidebar_picks','live_streams','live_chat_messages','super_chats','ads')
ORDER BY table_name;
