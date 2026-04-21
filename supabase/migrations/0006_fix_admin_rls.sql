-- 0006 — fix infinite RLS recursion on admin policies by using a SECURITY DEFINER helper
-- Issue: policy_X on T uses `exists(select from profiles ... role='admin')`
-- When that evaluates, RLS on profiles itself evaluates, which references profiles again -> infinite recursion (Postgres 42P17).

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Replace all admin policies with is_admin() check
drop policy if exists site_settings_write on site_settings;
create policy site_settings_write on site_settings for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_audit_read on admin_audit_log;
create policy admin_audit_read on admin_audit_log for select using (public.is_admin());
drop policy if exists admin_audit_insert on admin_audit_log;
create policy admin_audit_insert on admin_audit_log for insert with check (public.is_admin());

drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists videos_admin_all on videos;
create policy videos_admin_all on videos for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists locations_admin_all on locations;
create policy locations_admin_all on locations for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_admin_all on orders;
create policy orders_admin_all on orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists payouts_admin_all on payouts;
create policy payouts_admin_all on payouts for all using (public.is_admin()) with check (public.is_admin());

-- Grant execute to authenticated + anon so the function can be called in RLS eval
grant execute on function public.is_admin() to anon, authenticated;
