-- Migration 0013 — Live monetization (Super Chat) requires payout setup
-- Run ONCE in Supabase Dashboard → SQL Editor

BEGIN;

-- 1) profiles: payout fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paypal_email      text,
  ADD COLUMN IF NOT EXISTS payee_name        text,
  ADD COLUMN IF NOT EXISTS payout_country    text,
  ADD COLUMN IF NOT EXISTS payout_terms_at   timestamptz;

COMMENT ON COLUMN public.profiles.paypal_email IS 'PayPal email for receiving Super Chat 85% share';
COMMENT ON COLUMN public.profiles.payee_name IS 'Legal name for tax/payout records';
COMMENT ON COLUMN public.profiles.payout_country IS 'ISO-2 country code for tax reporting';
COMMENT ON COLUMN public.profiles.payout_terms_at IS 'When pilot accepted the payout/monetization terms';

-- Helper: is this profile ready to receive Super Chats?
CREATE OR REPLACE FUNCTION public.profile_can_receive_super_chats(p_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
      AND paypal_email IS NOT NULL
      AND payee_name   IS NOT NULL
      AND payout_country IS NOT NULL
      AND payout_terms_at IS NOT NULL
  );
$$;

-- 2) live_streams.monetization_enabled
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS monetization_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.live_streams.monetization_enabled IS 'When true, Super Chat is offered to viewers and 85/15 split applies. Requires pilot payout setup.';

-- 3) Server-side guard: prevent monetization on streams whose pilot has no payout info
CREATE OR REPLACE FUNCTION public.live_streams_check_monetization()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.monetization_enabled = true THEN
    IF NOT public.profile_can_receive_super_chats(NEW.pilot_id) THEN
      RAISE EXCEPTION 'Cannot enable monetization: pilot must complete payout setup first (paypal_email + payee_name + payout_country + terms accepted)'
        USING errcode = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_live_streams_monetization_check ON public.live_streams;
CREATE TRIGGER trg_live_streams_monetization_check
  BEFORE INSERT OR UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE PROCEDURE public.live_streams_check_monetization();

-- 4) Server-side guard: prevent Super Chat insert on non-monetized streams
CREATE OR REPLACE FUNCTION public.super_chats_check_stream()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  monetized boolean;
BEGIN
  SELECT monetization_enabled INTO monetized
  FROM public.live_streams WHERE id = NEW.stream_id;
  IF NOT COALESCE(monetized, false) THEN
    RAISE EXCEPTION 'Super Chats are only allowed on monetized live streams'
      USING errcode = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_super_chats_stream_check ON public.super_chats;
CREATE TRIGGER trg_super_chats_stream_check
  BEFORE INSERT ON public.super_chats
  FOR EACH ROW EXECUTE PROCEDURE public.super_chats_check_stream();

COMMIT;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name='profiles' AND column_name IN ('paypal_email','payee_name','payout_country','payout_terms_at')
ORDER BY column_name;
SELECT column_name FROM information_schema.columns
WHERE table_name='live_streams' AND column_name='monetization_enabled';
