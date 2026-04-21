-- Drone Icarus — Admin / CMS schema + RLS + role auto-promotion
-- 0005 site_settings / admin_audit_log / admin role policies

-- ========================================================================
-- site_settings: generic JSONB config table for CMS content
-- ========================================================================
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

create or replace function tg_site_settings_bump() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists site_settings_bump on site_settings;
create trigger site_settings_bump before update on site_settings
  for each row execute function tg_site_settings_bump();

-- Audit log for admin operations
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text not null,
  target_type text,
  target_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on admin_audit_log(created_at desc);

-- ========================================================================
-- RLS
-- ========================================================================
alter table site_settings enable row level security;
drop policy if exists site_settings_read on site_settings;
create policy site_settings_read on site_settings for select using (true);
drop policy if exists site_settings_write on site_settings;
create policy site_settings_write on site_settings for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

alter table admin_audit_log enable row level security;
drop policy if exists admin_audit_read on admin_audit_log;
create policy admin_audit_read on admin_audit_log for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists admin_audit_insert on admin_audit_log;
create policy admin_audit_insert on admin_audit_log for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Admin can do anything on the major tables
-- (these stack with existing user-scope policies; admin has the union of permissions)
drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all
  using (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'admin'))
  with check (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

drop policy if exists videos_admin_all on videos;
create policy videos_admin_all on videos for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists locations_admin_all on locations;
create policy locations_admin_all on locations for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists orders_admin_all on orders;
create policy orders_admin_all on orders for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists payouts_admin_all on payouts;
create policy payouts_admin_all on payouts for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ========================================================================
-- Auto-promote auto0104@gmail.com to admin on profile insert/update
-- ========================================================================
create or replace function public.promote_if_admin_email() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  user_email text;
begin
  select email into user_email from auth.users where id = new.id;
  if user_email = 'auto0104@gmail.com' then
    new.role := 'admin';
  end if;
  return new;
end $$;

drop trigger if exists profiles_auto_admin on profiles;
create trigger profiles_auto_admin
  before insert or update on profiles
  for each row execute function public.promote_if_admin_email();

-- Immediate promotion if the user already exists
update profiles set role = 'admin'
where id in (select id from auth.users where email = 'auto0104@gmail.com');

-- ========================================================================
-- Seed site_settings with defaults (so public frontend has something to read)
-- ========================================================================
insert into site_settings (key, value) values
  ('site', '{"name": "Drone Icarus", "tagline": "The atlas of aerial footage.", "commission_rate": 0.30, "tax_rate": 0.08, "payout_threshold_usd": 20, "payout_currency": "USD", "support_email": "support@icarus.fly"}'),
  ('hero', '{"eyebrow": "LIVE", "title": "The world,", "title_accent": "from 1,200 feet up.", "sub": "Pan the map. Click any pin to find aerial footage shot by pilots on the ground — from the Giza Plateau to Namsan Tower."}'),
  ('pricing', '{"eyebrow": "PRICING · CLIP-BY-CLIP MARKETPLACE", "hero": "Pilots set the price. You keep 70%.", "sub": "No subscriptions. No credits. Buyers pay each pilot directly for the clip they want. Drone Icarus takes a flat 30% per sale to cover hosting, payments, licensing paperwork, and trust & safety — that''s it."}'),
  ('pages_legal', '{"title": "Terms & Licensing", "updated_at": "2026-04-21", "sections": [{"h": "Overview", "body": "Drone Icarus is a marketplace connecting aerial pilots with viewers, editors, and studios. Pilots retain ownership of their footage."}, {"h": "Revenue split", "body": "Every sale is split the same way: 70% to the pilot, 30% to Drone Icarus."}]}'),
  ('faq', '[{"q": "Is there a subscription or monthly fee?", "a": "No. Drone Icarus is purely transactional. Buyers pay only when they license a clip."}, {"q": "Do verified pilots get a better split?", "a": "No. Verification gets you priority placement but the 70/30 split is identical for every pilot."}, {"q": "Who sets the clip price?", "a": "The pilot does. Suggested ranges appear but you have full control."}]'),
  ('announcements', '[]'),
  ('categories', '[]'),
  ('shot_bundles', '[]'),
  ('atlas_bounties', '[]'),
  ('featured_picks', '{"locations": [], "videos": []}')
on conflict (key) do nothing;
