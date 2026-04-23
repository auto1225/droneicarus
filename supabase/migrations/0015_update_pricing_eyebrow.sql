-- Migration 0015 — refresh pricing CMS strings to reflect Live + marketplace dual policy
UPDATE public.site_settings
SET value = jsonb_build_object(
  'eyebrow', 'PRICING · TWO REVENUE STREAMS · ONE SPLIT',
  'hero',    'You set the price. You keep 70%.',
  'sub',     'No subscriptions. No credits. Two ways to earn — sell your aerial clips one license at a time, or stream live and accept Super Chat tips. The same flat 70 / 30 pilot/platform split applies to everything. That''s the whole pricing.'
)
WHERE key = 'pricing';
