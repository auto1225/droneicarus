-- 0007_site_content.sql
-- CMS-editable content key-value store.
-- Every user-facing string in the site can be represented here so admins can
-- edit copy without code changes.
create table if not exists public.site_content (
  key         text primary key,
  category    text not null default 'misc',
  type        text not null default 'text'  -- text | longtext | markdown | html | url | image | json
    check (type in ('text','longtext','markdown','html','url','image','json')),
  value       text,
  description text,                        -- helper text shown to admins in the CMS
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

create index if not exists idx_site_content_category on public.site_content(category);

-- RLS: anyone (even anon) can read; only admin can write.
alter table public.site_content enable row level security;

drop policy if exists "site_content public read"  on public.site_content;
drop policy if exists "site_content admin write"  on public.site_content;
drop policy if exists "site_content admin update" on public.site_content;
drop policy if exists "site_content admin delete" on public.site_content;

create policy "site_content public read"
  on public.site_content
  for select using (true);

create policy "site_content admin write"
  on public.site_content
  for insert with check (public.is_admin());

create policy "site_content admin update"
  on public.site_content
  for update using (public.is_admin()) with check (public.is_admin());

create policy "site_content admin delete"
  on public.site_content
  for delete using (public.is_admin());

-- Bump updated_at on every change.
create or replace function public.site_content_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.updated_by is null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_site_content_touch on public.site_content;
create trigger trg_site_content_touch
  before insert or update on public.site_content
  for each row execute function public.site_content_touch();

-- ============================================================================
-- INITIAL SEED
-- ============================================================================
-- (Re-runnable via upsert; admins can edit, their edits survive re-migration)

insert into public.site_content (key, category, type, value, description) values
-- ── HEADER ──────────────────────────────────────────────────────────────────
  ('header.logo', 'header', 'text', 'DroneIcarus', 'Logo wordmark in the top-left'),
  ('header.badge', 'header', 'text', 'BETA', 'Small badge next to logo'),
  ('header.nav.map', 'header', 'text', 'Map', 'Top nav link — home map'),
  ('header.nav.explore', 'header', 'text', 'Explore', 'Top nav link — categories'),
  ('header.nav.shots', 'header', 'text', 'Shots', 'Top nav link — shot library'),
  ('header.nav.rankings', 'header', 'text', 'Rankings', 'Top nav link — charts'),
  ('header.nav.creators', 'header', 'text', 'Creators', 'Top nav link — pilots list'),
  ('header.nav.atlas', 'header', 'text', 'Atlas', 'Top nav link — bounties map'),
  ('header.nav.pricing', 'header', 'text', 'Pricing', 'Top nav link — pricing page'),
  ('header.nav.live', 'header', 'text', 'Live', 'Top nav link — live feed'),
  ('header.search.placeholder', 'header', 'text', 'Search locations, pilots, shots…', 'Global search bar placeholder'),
  ('header.search.shortcut', 'header', 'text', '⌘K', 'Keyboard shortcut hint in search bar'),
  ('header.btn.upload', 'header', 'text', 'Upload', 'Upload button label'),
  ('header.btn.signin', 'header', 'text', 'Sign in', 'Sign-in button label (signed-out state)'),
  ('header.btn.cms', 'header', 'text', 'CMS', 'Admin-only CMS button label'),
  ('header.avatar.menu.profile', 'header', 'text', 'My profile', 'Avatar menu — profile link'),
  ('header.avatar.menu.mypage', 'header', 'text', 'My page', 'Avatar menu — my page'),
  ('header.avatar.menu.upload', 'header', 'text', 'Upload a clip', 'Avatar menu — upload'),
  ('header.avatar.menu.earnings', 'header', 'text', 'Earnings', 'Avatar menu — earnings'),
  ('header.avatar.menu.orders', 'header', 'text', 'My licenses', 'Avatar menu — orders'),
  ('header.avatar.menu.settings', 'header', 'text', 'Settings', 'Avatar menu — settings'),
  ('header.avatar.menu.signout', 'header', 'text', 'Sign out', 'Avatar menu — sign out'),

-- ── FOOTER ──────────────────────────────────────────────────────────────────
  ('footer.tagline', 'footer', 'text', 'The atlas of aerial footage.', 'Big footer tagline'),
  ('footer.col1.heading', 'footer', 'text', 'Explore', 'Footer column 1 heading'),
  ('footer.col1.links', 'footer', 'json',
    '[{"label":"Map","route":"home"},{"label":"Shots","route":"shotlibrary"},{"label":"Atlas","route":"atlas"},{"label":"Live","route":"live"},{"label":"Rankings","route":"rankings"}]',
    'Footer column 1 — link array [{label, route}]'),
  ('footer.col2.heading', 'footer', 'text', 'For pilots', 'Footer column 2 heading'),
  ('footer.col2.links', 'footer', 'json',
    '[{"label":"Upload a clip","route":"upload"},{"label":"Creator studio","route":"creator"},{"label":"Earnings","route":"earnings"},{"label":"Pilot onboarding","route":"pilot-onboarding"},{"label":"Commission requests","route":"commission"}]',
    'Footer column 2 — link array'),
  ('footer.col3.heading', 'footer', 'text', 'Marketplace', 'Footer column 3 heading'),
  ('footer.col3.links', 'footer', 'json',
    '[{"label":"Pricing","route":"pricing"},{"label":"Licensing","route":"legal"},{"label":"Shot library","route":"shotlibrary"},{"label":"Advanced","route":"advanced"}]',
    'Footer column 3 — link array'),
  ('footer.col4.heading', 'footer', 'text', 'Company', 'Footer column 4 heading'),
  ('footer.col4.links', 'footer', 'json',
    '[{"label":"About","route":"legal"},{"label":"Contact","route":"legal"},{"label":"Terms","route":"legal"},{"label":"Privacy","route":"legal"},{"label":"Guidelines","route":"guidelines"}]',
    'Footer column 4 — link array'),
  ('footer.copyright', 'footer', 'text', '© {year} DroneIcarus, Inc. All footage belongs to its creators.', 'Footer copyright; {year} is replaced with current year'),
  ('footer.cta.headline', 'footer', 'text', 'Ready to map the world from above?', 'Footer CTA headline'),
  ('footer.cta.subtext', 'footer', 'text', 'Upload a clip or browse the atlas.', 'Footer CTA sub'),
  ('footer.cta.btn1', 'footer', 'text', 'Upload a clip', 'Footer CTA button 1 label'),
  ('footer.cta.btn2', 'footer', 'text', 'Browse the map', 'Footer CTA button 2 label'),

-- ── AUTH (sign in / sign up) ────────────────────────────────────────────────
  ('auth.tab.signin', 'auth', 'text', 'Sign in', 'Auth page — signin tab'),
  ('auth.tab.signup', 'auth', 'text', 'Create account', 'Auth page — signup tab'),
  ('auth.signin.title', 'auth', 'text', 'Welcome back, pilot.', 'Signin hero'),
  ('auth.signin.sub', 'auth', 'text', 'Every clip you ever bought, ready to stream.', 'Signin hero sub'),
  ('auth.signup.title', 'auth', 'text', 'Map the world from above.', 'Signup hero'),
  ('auth.signup.sub', 'auth', 'text', 'Share your aerial work. Set your price. Keep 70%.', 'Signup hero sub'),
  ('auth.oauth.google', 'auth', 'text', 'Continue with Google', 'Google OAuth button'),
  ('auth.divider.or', 'auth', 'text', 'or continue with email', 'OR divider label'),
  ('auth.field.email.label', 'auth', 'text', 'Email', 'Email field label'),
  ('auth.field.email.placeholder', 'auth', 'text', 'you@email.com', 'Email field placeholder'),
  ('auth.field.password.label', 'auth', 'text', 'Password', 'Password field label'),
  ('auth.field.password.placeholder', 'auth', 'text', '••••••••', 'Password field placeholder'),
  ('auth.field.handle.label', 'auth', 'text', 'Pilot handle', 'Handle field label'),
  ('auth.field.handle.placeholder', 'auth', 'text', '@yourhandle', 'Handle field placeholder'),
  ('auth.field.display.label', 'auth', 'text', 'Display name', 'Display name label'),
  ('auth.field.display.placeholder', 'auth', 'text', 'Your name', 'Display name placeholder'),
  ('auth.field.role.label', 'auth', 'text', 'I am a…', 'Role picker label'),
  ('auth.role.viewer', 'auth', 'text', 'Viewer / buyer', 'Role option — viewer'),
  ('auth.role.pilot', 'auth', 'text', 'Pilot / uploader', 'Role option — pilot'),
  ('auth.btn.signin', 'auth', 'text', 'Sign in', 'Signin submit button'),
  ('auth.btn.signup', 'auth', 'text', 'Create account', 'Signup submit button'),
  ('auth.btn.forgot', 'auth', 'text', 'Forgot password?', 'Forgot password link'),
  ('auth.reset.title', 'auth', 'text', 'Reset your password', 'Reset request form title'),
  ('auth.reset.sub', 'auth', 'text', 'We will email you a reset link.', 'Reset request form sub'),
  ('auth.reset.btn', 'auth', 'text', 'Send reset link', 'Reset submit button'),
  ('auth.reset.sent.title', 'auth', 'text', 'Check your inbox', 'Reset link sent screen title'),
  ('auth.reset.sent.sub', 'auth', 'text', 'We sent a reset link to your email. It may take a minute.', 'Reset link sent screen sub'),
  ('auth.verify.sent.title', 'auth', 'text', 'Check your inbox', 'Verification email sent title'),
  ('auth.verify.sent.sub', 'auth', 'text', 'Confirm your email to finish signing up.', 'Verification email sent sub'),
  ('auth.err.invalid_creds', 'auth', 'text', 'Wrong email or password.', 'Invalid credentials message'),
  ('auth.err.email_in_use', 'auth', 'text', 'This email is already registered.', 'Email already exists message'),
  ('auth.err.weak_password', 'auth', 'text', 'Password must be at least 8 characters.', 'Weak password message'),

-- ── HOME ────────────────────────────────────────────────────────────────────
  ('home.hero.eyebrow', 'home_hero', 'text', 'THE ATLAS OF AERIAL FOOTAGE', 'Hero small eyebrow line'),
  ('home.hero.title', 'home_hero', 'text', 'The world, from 1,200 feet up.', 'Hero headline'),
  ('home.hero.sub', 'home_hero', 'text', 'Browse, license, and download drone footage mapped to where it was shot.', 'Hero sub'),
  ('home.hero.cta.primary', 'home_hero', 'text', 'Explore the map', 'Hero primary CTA'),
  ('home.hero.cta.secondary', 'home_hero', 'text', 'Browse shots', 'Hero secondary CTA'),
  ('home.stats.clips.label', 'home_hero', 'text', 'CLIPS', 'Stat label — clips'),
  ('home.stats.pilots.label', 'home_hero', 'text', 'PILOTS', 'Stat label — pilots'),
  ('home.stats.countries.label', 'home_hero', 'text', 'COUNTRIES', 'Stat label — countries'),
  ('home.stats.minutes.label', 'home_hero', 'text', 'MINUTES LOGGED', 'Stat label — minutes'),
  ('home.section.featured.heading', 'home_hero', 'text', 'Featured clips this week', 'Featured section heading'),
  ('home.section.atlas.heading', 'home_hero', 'text', 'Atlas bounties', 'Atlas section heading'),
  ('home.section.atlas.sub', 'home_hero', 'text', 'Studios are asking pilots for specific shots. Pick one up.', 'Atlas section sub'),

-- ── PRICING ─────────────────────────────────────────────────────────────────
  ('pricing.hero.eyebrow', 'pricing', 'text', 'MARKETPLACE', 'Pricing page eyebrow'),
  ('pricing.hero.title', 'pricing', 'text', 'Pilots set the price. You keep 70%.', 'Pricing hero'),
  ('pricing.hero.sub', 'pricing', 'text', 'No subscriptions. No floors. Price per license, take 70% of every sale.', 'Pricing hero sub'),
  ('pricing.buyer.heading', 'pricing', 'text', 'For buyers', 'Pricing buyer card heading'),
  ('pricing.pilot.heading', 'pricing', 'text', 'For pilots', 'Pricing pilot card heading'),
  ('pricing.split.label.pilot', 'pricing', 'text', '70% to the pilot', 'Split bar pilot label'),
  ('pricing.split.label.platform', 'pricing', 'text', '30% platform', 'Split bar platform label'),
  ('pricing.calc.heading', 'pricing', 'text', 'Earnings calculator', 'Calc section heading'),
  ('pricing.calc.price.label', 'pricing', 'text', 'Clip price ($)', 'Calc — price input'),
  ('pricing.calc.sales.label', 'pricing', 'text', 'Licenses sold per month', 'Calc — sales input'),
  ('pricing.calc.result.label', 'pricing', 'text', 'Your monthly take-home', 'Calc — result'),

-- ── STATIC ──────────────────────────────────────────────────────────────────
  ('static.404.eyebrow', 'static', 'text', '● SIGNAL LOST · 404', '404 eyebrow line'),
  ('static.404.title', 'static', 'text', 'Off the map.', '404 headline'),
  ('static.404.sub', 'static', 'text', 'This page is not in the flight log. It may have been removed, re-tagged, or it never existed. Let us get you back in range.', '404 body'),
  ('static.404.btn.home', 'static', 'text', 'Return to map', '404 primary CTA'),
  ('static.404.btn.shots', 'static', 'text', 'Browse trending', '404 secondary CTA'),

-- ── TOAST / EMPTY / PLACEHOLDER ─────────────────────────────────────────────
  ('toast.placeholder.generic', 'toast', 'text', 'This action will be available soon.', 'Orphan-button fallback toast'),
  ('toast.auth.signin_required', 'toast', 'text', 'Sign in to continue.', 'Auth required gate'),
  ('toast.copy.success', 'toast', 'text', 'Copied to clipboard.', 'Generic copy success'),
  ('toast.save.success', 'toast', 'text', 'Saved.', 'Generic save success'),
  ('toast.save.failed', 'toast', 'text', 'Could not save. Please retry.', 'Generic save failure'),
  ('empty.search.title', 'empty', 'text', 'No results', 'Empty search title'),
  ('empty.search.sub', 'empty', 'text', 'Try a different keyword or location.', 'Empty search sub'),
  ('empty.collection.title', 'empty', 'text', 'Nothing here yet', 'Empty collection title'),
  ('empty.collection.sub', 'empty', 'text', 'Add clips to your collection to see them here.', 'Empty collection sub')
on conflict (key) do nothing;
