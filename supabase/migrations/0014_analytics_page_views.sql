-- Migration 0014 — visitor analytics: page_views + aggregate helpers
BEGIN;

CREATE TABLE IF NOT EXISTS public.page_views (
  id              bigserial primary key,
  session_id      text not null,
  user_id         uuid references auth.users(id) on delete set null,
  user_email      text,
  user_handle     text,
  user_role       text,
  is_member       boolean not null default false,
  path            text not null,
  full_url        text,
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  country         text,
  region          text,
  city            text,
  ip              inet,
  user_agent      text,
  browser         text,
  os              text,
  device          text,
  screen          text,
  language        text,
  timezone        text,
  duration_ms     int,
  scroll_pct      int,
  created_at      timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_pv_created  ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_user     ON public.page_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pv_session  ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_pv_country  ON public.page_views(country);
CREATE INDEX IF NOT EXISTS idx_pv_path     ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_member   ON public.page_views(is_member);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can insert page_views" ON public.page_views;
CREATE POLICY "anyone can insert page_views" ON public.page_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admins read page_views" ON public.page_views;
CREATE POLICY "admins read page_views" ON public.page_views
  FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.analytics_kpis(p_from timestamptz, p_to timestamptz)
RETURNS TABLE (pageviews bigint, unique_visitors bigint, unique_sessions bigint,
               members bigint, guests bigint, countries bigint,
               bounce_rate numeric, avg_session_seconds numeric)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH base AS (
    SELECT * FROM public.page_views WHERE created_at >= p_from AND created_at < p_to
  ),
  sess AS (
    SELECT session_id, COUNT(*) AS hits,
           EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS duration
    FROM base GROUP BY session_id
  )
  SELECT
    (SELECT COUNT(*) FROM base),
    (SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) FROM base),
    (SELECT COUNT(DISTINCT session_id) FROM base),
    (SELECT COUNT(DISTINCT user_id) FROM base WHERE user_id IS NOT NULL),
    (SELECT COUNT(DISTINCT session_id) FROM base WHERE user_id IS NULL),
    (SELECT COUNT(DISTINCT country) FROM base WHERE country IS NOT NULL),
    COALESCE((SELECT 100.0 * SUM(CASE WHEN hits = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) FROM sess), 0),
    COALESCE((SELECT AVG(duration) FROM sess WHERE duration > 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.analytics_country_breakdown(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 30)
RETURNS TABLE (country text, pageviews bigint, unique_visitors bigint)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(country,'Unknown') as country,
         COUNT(*),
         COUNT(DISTINCT COALESCE(user_id::text, session_id))
  FROM public.page_views
  WHERE created_at >= p_from AND created_at < p_to
  GROUP BY 1 ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_top_pages(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 25)
RETURNS TABLE (path text, pageviews bigint, unique_visitors bigint)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT path, COUNT(*),
         COUNT(DISTINCT COALESCE(user_id::text, session_id))
  FROM public.page_views WHERE created_at >= p_from AND created_at < p_to
  GROUP BY path ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_top_referrers(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 25)
RETURNS TABLE (referrer text, pageviews bigint)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(NULLIF(regexp_replace(referrer, '^https?://([^/]+).*', '\1'), ''), 'direct'),
         COUNT(*)
  FROM public.page_views WHERE created_at >= p_from AND created_at < p_to
  GROUP BY 1 ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_breakdown(p_field text, p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 25)
RETURNS TABLE (label text, pageviews bigint)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE q text;
BEGIN
  IF p_field NOT IN ('browser','os','device','language','timezone','utm_source','utm_medium','utm_campaign') THEN
    RAISE EXCEPTION 'unsupported field';
  END IF;
  q := format('SELECT COALESCE(%I,''Unknown''), COUNT(*) FROM public.page_views
               WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 2 DESC LIMIT $3', p_field);
  RETURN QUERY EXECUTE q USING p_from, p_to, p_limit;
END $$;

CREATE OR REPLACE FUNCTION public.analytics_timeseries(p_from timestamptz, p_to timestamptz, p_bucket text DEFAULT 'day')
RETURNS TABLE (bucket timestamptz, pageviews bigint, unique_visitors bigint)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE q text;
BEGIN
  IF p_bucket NOT IN ('hour','day','week','month') THEN RAISE EXCEPTION 'invalid bucket'; END IF;
  q := format($f$
    SELECT date_trunc('%s', created_at), COUNT(*),
           COUNT(DISTINCT COALESCE(user_id::text, session_id))
    FROM public.page_views WHERE created_at >= $1 AND created_at < $2
    GROUP BY 1 ORDER BY 1
  $f$, p_bucket);
  RETURN QUERY EXECUTE q USING p_from, p_to;
END $$;

CREATE OR REPLACE FUNCTION public.analytics_top_members(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 30)
RETURNS TABLE (user_id uuid, user_email text, user_handle text, pageviews bigint, sessions bigint, last_seen timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT user_id, MAX(user_email), MAX(user_handle),
         COUNT(*), COUNT(DISTINCT session_id), MAX(created_at)
  FROM public.page_views WHERE created_at >= p_from AND created_at < p_to AND user_id IS NOT NULL
  GROUP BY user_id ORDER BY 4 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.analytics_realtime(p_seconds int DEFAULT 300)
RETURNS TABLE (active_users bigint, active_members bigint, top_paths jsonb)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH recent AS (
    SELECT * FROM public.page_views WHERE created_at > now() - (p_seconds || ' seconds')::interval
  )
  SELECT
    (SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) FROM recent),
    (SELECT COUNT(DISTINCT user_id) FROM recent WHERE user_id IS NOT NULL),
    (SELECT jsonb_agg(jsonb_build_object('path', path, 'hits', cnt)) FROM (
       SELECT path, COUNT(*) as cnt FROM recent GROUP BY path ORDER BY 2 DESC LIMIT 5
     ) t);
$$;

COMMIT;
