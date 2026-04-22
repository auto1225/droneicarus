-- Migration 0010 — Lab section (research / projects / hardware / learn / pulse)
-- Run ONCE in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/eotsbncgkgewgbemaarp/sql/new

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. lab_tags — master taxonomy (slug + i18n labels)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lab_tags (
  slug         text primary key,
  label_en     text not null,
  label_ko     text,
  parent_slug  text references public.lab_tags(slug) on delete set null,
  description  text,
  icon         text,                            -- 'Ic.mountain' or SVG path
  item_count   int  default 0,
  sort_order   int  default 0,
  created_at   timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_lab_tags_parent ON public.lab_tags(parent_slug);

-- Seed core top-level tags
INSERT INTO public.lab_tags (slug, label_en, label_ko, sort_order) VALUES
  ('computer-vision',   'Computer Vision',    '컴퓨터 비전',      10),
  ('navigation',        'Navigation',         '네비게이션',       20),
  ('swarm',             'Swarm Robotics',     '스웜 로보틱스',    30),
  ('power',             'Power & Energy',     '전력·에너지',      40),
  ('aerodynamics',      'Aerodynamics',       '공기역학',         50),
  ('hardware-type',     'Hardware',           '하드웨어',         60),
  ('firmware',          'Firmware',           '펌웨어',           70),
  ('regulation',        'Regulation',         '규제',             80),
  ('application',       'Application',        '응용 분야',        90),
  ('fpv',               'FPV',                'FPV',              100),
  ('mapping',           'Mapping & Survey',   '매핑·측량',        110),
  ('delivery',          'Delivery',           '배달',             120),
  ('agriculture',       'Agriculture',        '농업',             130),
  ('cinematography',    'Cinematography',     '시네마토그래피',   140),
  ('racing',            'Racing',             '레이싱',           150),
  ('autonomous',        'Autonomous',         '자율 비행',        160),
  ('swarm-coordination','Swarm Coordination', '군집 조정',        170),
  ('slam',              'SLAM',               'SLAM',             180),
  ('obstacle-avoidance','Obstacle Avoidance', '장애물 회피',      190),
  ('path-planning',     'Path Planning',      '경로 계획',        200)
ON CONFLICT (slug) DO NOTHING;

-- Sub-tags (parent relationships)
INSERT INTO public.lab_tags (slug, label_en, label_ko, parent_slug, sort_order) VALUES
  ('flight-controller', 'Flight Controller',  '플라이트 컨트롤러', 'hardware-type', 10),
  ('esc',               'ESC',                'ESC',               'hardware-type', 20),
  ('motor',             'Motor',              '모터',              'hardware-type', 30),
  ('battery',           'Battery',            '배터리',            'hardware-type', 40),
  ('camera',            'Camera',             '카메라',            'hardware-type', 50),
  ('gps',               'GPS',                'GPS',               'hardware-type', 60),
  ('receiver',          'Radio Receiver',     '수신기',            'hardware-type', 70),
  ('antenna',           'Antenna',            '안테나',            'hardware-type', 80),
  ('frame',             'Frame',              '프레임',            'hardware-type', 90),
  ('faa-part-107',      'FAA Part 107',       'FAA Part 107',      'regulation',    10),
  ('easa',              'EASA (EU)',          'EASA (유럽)',       'regulation',    20),
  ('kcaa',              'KCAA (Korea)',       '국토교통부 (한국)', 'regulation',    30),
  ('remote-id',         'Remote ID',          '원격 식별',         'regulation',    40)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. lab_items — main content table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lab_items (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,    -- 'paper'|'patent'|'project'|'hardware'|'tutorial'|'news'|'event'
  subsection      text not null,    -- 'research'|'projects'|'hardware'|'learn'|'pulse'
  title           text not null,
  slug            text unique,
  summary         text,             -- 2-3 sentences
  body_markdown   text,             -- optional long-form
  cover_image_url text,             -- external or Supabase storage
  external_url    text,             -- canonical link (arxiv/github/amazon)
  authors         text[],
  institution     text,
  published_at    timestamptz,      -- when the original was published externally
  tags            text[] default '{}',    -- array of slugs from lab_tags
  level           text,             -- 'beginner'|'intermediate'|'advanced' (for learn)
  price_min_usd   numeric,          -- for hardware
  price_max_usd   numeric,          -- for hardware
  brand           text,             -- for hardware
  spec            jsonb,            -- structured specs (hardware)
  submitted_by    uuid references auth.users(id) on delete set null,
  status          text default 'pending',   -- 'pending'|'approved'|'rejected'
  upvotes         int default 0,
  saves           int default 0,
  views           int default 0,
  comment_count   int default 0,
  featured        bool default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_lab_items_subsection ON public.lab_items(subsection);
CREATE INDEX IF NOT EXISTS idx_lab_items_status     ON public.lab_items(status);
CREATE INDEX IF NOT EXISTS idx_lab_items_tags       ON public.lab_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lab_items_published  ON public.lab_items(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_lab_items_featured   ON public.lab_items(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_lab_items_type       ON public.lab_items(type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.lab_items_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_lab_items_updated_at ON public.lab_items;
CREATE TRIGGER trg_lab_items_updated_at
  BEFORE UPDATE ON public.lab_items
  FOR EACH ROW EXECUTE PROCEDURE public.lab_items_touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3. lab_votes — upvotes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lab_votes (
  item_id    uuid references public.lab_items(id) on delete cascade,
  user_id    uuid references auth.users(id)      on delete cascade,
  vote       smallint default 1,
  created_at timestamptz default now(),
  primary key (item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_votes_user ON public.lab_votes(user_id);

-- Keep upvotes count in sync
CREATE OR REPLACE FUNCTION public.lab_votes_recount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE tgt uuid;
BEGIN
  tgt := COALESCE(NEW.item_id, OLD.item_id);
  UPDATE public.lab_items
    SET upvotes = (SELECT COALESCE(SUM(vote),0) FROM public.lab_votes WHERE item_id = tgt)
  WHERE id = tgt;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS trg_lab_votes_recount ON public.lab_votes;
CREATE TRIGGER trg_lab_votes_recount
  AFTER INSERT OR UPDATE OR DELETE ON public.lab_votes
  FOR EACH ROW EXECUTE PROCEDURE public.lab_votes_recount();

-- ─────────────────────────────────────────────────────────────
-- 4. lab_saves — personal bookmarks
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lab_saves (
  item_id  uuid references public.lab_items(id) on delete cascade,
  user_id  uuid references auth.users(id)      on delete cascade,
  saved_at timestamptz default now(),
  primary key (item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_saves_user ON public.lab_saves(user_id, saved_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS policies
-- ─────────────────────────────────────────────────────────────

-- lab_items: public reads approved items; admins read all; authors read own pending
ALTER TABLE public.lab_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads approved items" ON public.lab_items;
CREATE POLICY "public reads approved items" ON public.lab_items
  FOR SELECT USING (status = 'approved' OR public.is_admin() OR submitted_by = auth.uid());

DROP POLICY IF EXISTS "users submit pending items" ON public.lab_items;
CREATE POLICY "users submit pending items" ON public.lab_items
  FOR INSERT WITH CHECK (submitted_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "admins update items" ON public.lab_items;
CREATE POLICY "admins update items" ON public.lab_items
  FOR UPDATE USING (public.is_admin())
            WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins delete items" ON public.lab_items;
CREATE POLICY "admins delete items" ON public.lab_items
  FOR DELETE USING (public.is_admin());

-- lab_tags: public reads, admin writes
ALTER TABLE public.lab_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads tags" ON public.lab_tags;
CREATE POLICY "public reads tags" ON public.lab_tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins write tags" ON public.lab_tags;
CREATE POLICY "admins write tags" ON public.lab_tags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- lab_votes: users manage own
ALTER TABLE public.lab_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own votes" ON public.lab_votes;
CREATE POLICY "users manage own votes" ON public.lab_votes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "public reads vote counts" ON public.lab_votes;
CREATE POLICY "public reads vote counts" ON public.lab_votes
  FOR SELECT USING (true);

-- lab_saves: users manage own, private
ALTER TABLE public.lab_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own saves" ON public.lab_saves;
CREATE POLICY "users manage own saves" ON public.lab_saves
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 6. Grants (so the service role key can always admin these tables)
-- ─────────────────────────────────────────────────────────────
GRANT ALL ON public.lab_items TO service_role;
GRANT ALL ON public.lab_votes TO service_role;
GRANT ALL ON public.lab_saves TO service_role;
GRANT ALL ON public.lab_tags  TO service_role;

COMMIT;

-- Verify
SELECT 'lab_items' as table, count(*) FROM public.lab_items
UNION ALL SELECT 'lab_tags', count(*) FROM public.lab_tags
UNION ALL SELECT 'lab_votes', count(*) FROM public.lab_votes
UNION ALL SELECT 'lab_saves', count(*) FROM public.lab_saves;
