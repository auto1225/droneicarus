-- Drone Icarus — initial schema
-- Maps the mock data model in data.jsx to real Postgres tables.
-- Run: supabase db push   (or paste into SQL Editor)

-- =========================================
-- EXTENSIONS
-- =========================================
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- =========================================
-- ENUMS
-- =========================================
do $$ begin
  create type user_role as enum ('viewer', 'pilot', 'studio', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type video_status as enum ('draft', 'processing', 'published', 'rejected', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type license_tier as enum ('personal', 'commercial', 'extended', 'exclusive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'processing', 'complete', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payout_status as enum ('scheduled', 'paid', 'failed');
exception when duplicate_object then null; end $$;

-- =========================================
-- PROFILES (extends auth.users)
-- =========================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  email         text,
  avatar_url    text,
  bio           text,
  location      text,
  role          user_role not null default 'viewer',
  pilot_verified boolean not null default false,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint handle_format check (handle ~ '^@[a-z0-9_.]{2,24}$')
);

create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_handle_idx on profiles(handle);

-- =========================================
-- LOCATIONS (geographic landmarks)
-- =========================================
create table if not exists locations (
  id          text primary key,                   -- slug e.g. 'pyramids'
  name        text not null,
  country     text not null,
  lat         double precision not null,
  lon         double precision not null,
  geog        geography(point, 4326)
              generated always as (st_setsrid(st_makepoint(lon, lat), 4326)::geography) stored,
  category    text not null,
  featured    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists locations_geog_idx on locations using gist (geog);
create index if not exists locations_category_idx on locations(category);
create index if not exists locations_featured_idx on locations(featured) where featured = true;

-- =========================================
-- VIDEOS
-- =========================================
create table if not exists videos (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,                    -- short shareable id
  title           text not null,
  description     text,
  owner_id        uuid not null references profiles(id) on delete cascade,
  location_id     text references locations(id) on delete set null,
  category        text not null,
  yt_id           text,                           -- YouTube fallback while storage migrates
  storage_path    text,                           -- supabase-storage key (videos bucket)
  thumb_path      text,                           -- thumbnail storage key
  duration_s      integer,                        -- duration in seconds
  resolution      text,                           -- '4K', '5.7K', '6K', '8K'
  fps             integer default 24,
  codec           text,
  file_size_bytes bigint,
  price_usd       numeric(10,2) not null default 0,
  license_tiers   license_tier[] not null default '{personal}'::license_tier[],
  status          video_status not null default 'draft',
  views           integer not null default 0,
  likes           integer not null default 0,
  tags            text[] not null default '{}'::text[],
  uploaded_at     timestamptz not null default now(),
  published_at    timestamptz,
  -- EXIF-ish
  shot_lat        double precision,
  shot_lon        double precision,
  altitude_m      integer,
  drone_model     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists videos_owner_idx on videos(owner_id);
create index if not exists videos_location_idx on videos(location_id);
create index if not exists videos_category_idx on videos(category);
create index if not exists videos_status_idx on videos(status);
create index if not exists videos_published_idx on videos(published_at desc) where status = 'published';
create index if not exists videos_views_idx on videos(views desc) where status = 'published';

-- =========================================
-- COLLECTIONS (Pinterest-style boards)
-- =========================================
create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  name        text not null,
  description text,
  is_private  boolean not null default false,
  cover_urls  text[] not null default '{}'::text[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  video_id      uuid not null references videos(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, video_id)
);

create index if not exists collection_items_video_idx on collection_items(video_id);

-- =========================================
-- FOLLOWS
-- =========================================
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- =========================================
-- LIKES
-- =========================================
create table if not exists likes (
  user_id    uuid not null references profiles(id) on delete cascade,
  video_id   uuid not null references videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index if not exists likes_video_idx on likes(video_id);

-- =========================================
-- COMMENTS (YouTube-style threaded)
-- =========================================
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  video_id    uuid not null references videos(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references comments(id) on delete cascade,
  body        text not null,
  likes_count integer not null default 0,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists comments_video_idx on comments(video_id, created_at desc);
create index if not exists comments_parent_idx on comments(parent_id) where parent_id is not null;

-- =========================================
-- ORDERS (license purchases)
-- =========================================
create table if not exists orders (
  id           text primary key,                 -- e.g. 'DI-2026-04821'
  buyer_id     uuid not null references profiles(id) on delete restrict,
  video_id     uuid not null references videos(id) on delete restrict,
  license      license_tier not null,
  subtotal     numeric(10,2) not null,
  tax          numeric(10,2) not null default 0,
  total        numeric(10,2) not null,
  currency     text not null default 'USD',
  payment_ref  text,                             -- stripe/paypal ref
  payment_brand text,                            -- 'Visa', 'PayPal', …
  payment_last4 text,
  status       order_status not null default 'processing',
  file_format  text,
  file_size    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists orders_buyer_idx on orders(buyer_id, created_at desc);
create index if not exists orders_video_idx on orders(video_id);

-- =========================================
-- PAYOUTS (creator earnings)
-- =========================================
create table if not exists payouts (
  id          text primary key,                  -- 'po_001'
  pilot_id    uuid not null references profiles(id) on delete restrict,
  period      text not null,                     -- 'Mar 2026'
  gross       numeric(12,2) not null,
  fees        numeric(12,2) not null default 0,
  net         numeric(12,2) not null,
  currency    text not null default 'USD',
  method      text,                              -- 'Wise · USD'
  status      payout_status not null default 'scheduled',
  eta         date,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists payouts_pilot_idx on payouts(pilot_id, created_at desc);

-- =========================================
-- REVIEWS (per video)
-- =========================================
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references videos(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  role       text,
  body       text not null,
  created_at timestamptz not null default now(),
  unique (video_id, author_id)
);

create index if not exists reviews_video_idx on reviews(video_id);

-- =========================================
-- MESSAGES (DMs)
-- =========================================
create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conv_idx on messages(conversation_id, created_at desc);

-- =========================================
-- NOTIFICATIONS
-- =========================================
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        text not null,                      -- 'comment', 'like', 'sale', 'follow', 'system'
  title       text not null,
  body        text,
  target_url  text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on notifications(user_id, created_at desc) where read_at is null;

-- =========================================
-- updated_at TRIGGERS
-- =========================================
create or replace function tg_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  create trigger profiles_updated before update on profiles for each row execute function tg_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger videos_updated before update on videos for each row execute function tg_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger collections_updated before update on collections for each row execute function tg_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger comments_updated before update on comments for each row execute function tg_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger orders_updated before update on orders for each row execute function tg_set_updated_at();
exception when duplicate_object then null; end $$;

-- =========================================
-- AUTH HOOK — auto-create profile row on signup
-- =========================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', '@user' || substr(replace(new.id::text,'-',''),1,6)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    new.email
  )
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
