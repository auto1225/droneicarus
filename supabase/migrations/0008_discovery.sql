-- 0008_discovery.sql
-- YouTube discovery — extend videos + add discovery_queries/discovery_runs.

-- ==== 1. videos table extensions ===========================================
alter table public.videos
  add column if not exists source text not null default 'original'
    check (source in ('original', 'youtube')),
  add column if not exists youtube_id text,
  add column if not exists youtube_channel text,
  add column if not exists youtube_published_at timestamptz,
  add column if not exists ai_summary text,
  add column if not exists ai_quality_score int,
  add column if not exists discovery_batch_id uuid,
  add column if not exists inferred_location_raw jsonb,
  add column if not exists lat double precision,
  add column if not exists lon double precision;

create unique index if not exists idx_videos_youtube_id
  on public.videos(youtube_id) where youtube_id is not null;

create index if not exists idx_videos_source on public.videos(source);
create index if not exists idx_videos_discovery_batch on public.videos(discovery_batch_id);

-- ==== 2. discovery_queries =================================================
create table if not exists public.discovery_queries (
  id          uuid primary key default gen_random_uuid(),
  query       text not null,
  category    text,
  active      boolean not null default true,
  last_run_at timestamptz,
  last_found  int,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.discovery_queries enable row level security;
drop policy if exists "dq public read" on public.discovery_queries;
drop policy if exists "dq admin write" on public.discovery_queries;
drop policy if exists "dq admin upd"   on public.discovery_queries;
drop policy if exists "dq admin del"   on public.discovery_queries;

create policy "dq public read" on public.discovery_queries for select using (true);
create policy "dq admin write" on public.discovery_queries for insert with check (public.is_admin());
create policy "dq admin upd"   on public.discovery_queries for update using (public.is_admin()) with check (public.is_admin());
create policy "dq admin del"   on public.discovery_queries for delete using (public.is_admin());

-- ==== 3. discovery_runs ====================================================
create table if not exists public.discovery_runs (
  id            uuid primary key default gen_random_uuid(),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  triggered_by  text,                     -- 'cron' | 'manual' | user id
  queries_used  int,
  candidates    int default 0,
  inserted      int default 0,
  updated       int default 0,
  skipped_dupes int default 0,
  skipped_low   int default 0,
  errors        jsonb default '[]'::jsonb,
  stats         jsonb default '{}'::jsonb
);

alter table public.discovery_runs enable row level security;
drop policy if exists "dr public read" on public.discovery_runs;
drop policy if exists "dr admin write" on public.discovery_runs;
create policy "dr public read" on public.discovery_runs for select using (true);
create policy "dr admin write" on public.discovery_runs for insert with check (public.is_admin());
create policy "dr admin upd"   on public.discovery_runs for update using (public.is_admin()) with check (public.is_admin());

-- ==== 4. Seed queries (30 diverse drone-footage searches) ==================
insert into public.discovery_queries (query, category, notes) values
  ('cinematic drone Norway fjord',      'mountain',   'Nordic fjords'),
  ('aerial drone Iceland landscape',    'landscape',  'Iceland'),
  ('drone footage Tokyo at night',      'cityscape',  'Japan night cities'),
  ('Uluru Ayers Rock drone sunrise',    'desert',     'Australia red center'),
  ('drone footage Swiss Alps 4K',       'mountain',   'Swiss alpine'),
  ('aerial drone Patagonia Torres',     'mountain',   'Patagonia'),
  ('drone footage Amazon rainforest',   'forest',     'Amazonian river'),
  ('cinematic drone Faroe Islands',     'ocean',      'North Atlantic isles'),
  ('drone footage New York skyline',    'cityscape',  'NYC aerial'),
  ('drone footage Antelope Canyon',     'desert',     'US Southwest'),
  ('aerial drone Great Barrier Reef',   'ocean',      'Queensland reef'),
  ('drone footage Dolomites Italy',     'mountain',   'Italian alps'),
  ('aerial Santorini drone sunset',     'cityscape',  'Greek islands'),
  ('drone footage Bagan Myanmar',       'landscape',  'Temple field'),
  ('aerial Sahara desert drone',        'desert',     'Sahara dunes'),
  ('drone footage Venice canals',       'cityscape',  'Venetian aerial'),
  ('aerial drone Seoul night 4K',       'cityscape',  'Korea'),
  ('drone footage Maldives atoll',      'ocean',      'Tropical atolls'),
  ('aerial drone Lofoten Islands',      'ocean',      'Arctic islands'),
  ('drone footage Hallstatt Austria',   'landscape',  'Alpine village'),
  ('aerial drone Bali rice terraces',   'landscape',  'Indonesia'),
  ('drone footage Petra Jordan',        'desert',     'Jordan antiquity'),
  ('aerial Machu Picchu drone',         'mountain',   'Peru'),
  ('drone footage Grand Canyon',        'landscape',  'USA'),
  ('aerial drone Plitvice lakes',       'forest',     'Croatia'),
  ('drone footage Victoria Falls',      'landscape',  'Zambia/Zimbabwe'),
  ('aerial drone Yosemite valley',      'mountain',   'California'),
  ('drone footage Cappadocia balloons', 'landscape',  'Turkey'),
  ('aerial drone Mount Fuji sunrise',   'mountain',   'Japan iconic'),
  ('drone footage Kilimanjaro summit',  'mountain',   'Tanzania')
on conflict do nothing;
