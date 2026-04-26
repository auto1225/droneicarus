-- supabase/migrations/0018_atlas_bounties.sql
-- Atlas bounty system: places-not-yet-filmed crowdsourced wishlist
-- Author: Atlas system rebuild, 2026-04-26

------------------------------------------------------------------------
-- 1. Tables
------------------------------------------------------------------------

create table if not exists public.bounties (
  id uuid primary key default gen_random_uuid(),
  place text not null,
  country text not null,
  brief text not null,
  lat double precision,
  lon double precision,
  difficulty text not null check (difficulty in ('easy','moderate','hard','extreme')),
  tags text[] default '{}',
  deadline date,
  status text not null default 'open' check (status in ('open','claimed','completed','cancelled','expired')),
  created_by uuid references auth.users(id) on delete set null,
  is_demo boolean default false,
  created_at timestamptz default now()
);
create index if not exists bounties_status_deadline_idx on public.bounties(status, deadline);

create table if not exists public.bounty_purses (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.bounties(id) on delete cascade,
  contributor_id uuid references auth.users(id) on delete set null,
  amount_usd integer not null check (amount_usd >= 5),
  is_demo boolean default false,
  created_at timestamptz default now()
);
create index if not exists bounty_purses_bounty_idx on public.bounty_purses(bounty_id);

create table if not exists public.bounty_votes (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.bounties(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (bounty_id, voter_id)
);

create table if not exists public.bounty_claims (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.bounties(id) on delete cascade,
  claimer_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz default now(),
  deadline timestamptz not null,
  submission_video_id uuid references public.videos(id) on delete set null,
  status text not null default 'active' check (status in ('active','submitted','approved','rejected','expired'))
);

-- One open claim per bounty (active OR submitted blocks new claims).
-- Settled claims (approved/rejected/expired) don't block re-claim.
create unique index if not exists one_active_claim_per_bounty
  on public.bounty_claims(bounty_id)
  where status in ('active', 'submitted');

------------------------------------------------------------------------
-- 2. RLS
------------------------------------------------------------------------

alter table public.bounties        enable row level security;
alter table public.bounty_purses   enable row level security;
alter table public.bounty_votes    enable row level security;
alter table public.bounty_claims   enable row level security;

drop policy if exists "bounties read"        on public.bounties;
drop policy if exists "bounties insert auth" on public.bounties;
drop policy if exists "purses read"          on public.bounty_purses;
drop policy if exists "purses insert auth"   on public.bounty_purses;
drop policy if exists "votes read"           on public.bounty_votes;
drop policy if exists "votes insert auth"    on public.bounty_votes;
drop policy if exists "votes delete own"     on public.bounty_votes;
drop policy if exists "claims read"          on public.bounty_claims;
drop policy if exists "claims insert auth"   on public.bounty_claims;
drop policy if exists "claims update own"    on public.bounty_claims;

create policy "bounties read"        on public.bounties        for select using (true);
create policy "bounties insert auth" on public.bounties        for insert with check (auth.uid() = created_by);
create policy "purses read"          on public.bounty_purses   for select using (true);
create policy "purses insert auth"   on public.bounty_purses   for insert with check (auth.uid() = contributor_id);
create policy "votes read"           on public.bounty_votes    for select using (true);
create policy "votes insert auth"    on public.bounty_votes    for insert with check (auth.uid() = voter_id);
create policy "votes delete own"     on public.bounty_votes    for delete using (auth.uid() = voter_id);
create policy "claims read"          on public.bounty_claims   for select using (true);
create policy "claims insert auth"   on public.bounty_claims   for insert with check (auth.uid() = claimer_id);
create policy "claims update own"    on public.bounty_claims   for update using (auth.uid() = claimer_id);

------------------------------------------------------------------------
-- 3. Aggregate view
------------------------------------------------------------------------

drop view if exists public.bounty_stats;
create view public.bounty_stats as
select
  b.id,
  coalesce(sum(p.amount_usd), 0)::int as purse_total,
  count(distinct v.id)::int as votes_count,
  count(distinct c.id) filter (where c.status in ('active','submitted'))::int as active_claims
from public.bounties b
left join public.bounty_purses p on p.bounty_id = b.id
left join public.bounty_votes  v on v.bounty_id = b.id
left join public.bounty_claims c on c.bounty_id = b.id
group by b.id;

grant select on public.bounty_stats to anon, authenticated;

------------------------------------------------------------------------
-- 4. Seed 8 demo bounties (idempotent — only inserts if no rows yet)
------------------------------------------------------------------------

do $$
declare
  has_rows boolean;
  b1 uuid; b2 uuid; b3 uuid; b4 uuid; b5 uuid; b6 uuid; b7 uuid; b8 uuid;
begin
  select exists(select 1 from public.bounties where is_demo = true) into has_rows;
  if has_rows then
    raise notice 'demo bounties already seeded, skipping';
    return;
  end if;

  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Socotra — Dragon Blood Forest', 'Yemen', 'First-light overhead of the alien canopy. No one has uploaded this under open commercial license yet.', 12.4634, 53.8237, 'extreme', array['remote','endemic flora'], '2026-06-30', true)
    returning id into b1;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Salar de Uyuni — mirror season', 'Bolivia', 'That 2-week window in Feb when the salt flat floods. Need reflections showing the horizon swap.', -20.1338, -67.4891, 'moderate', array['reflection','altitude'], '2027-02-15', true)
    returning id into b2;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Meteora monasteries at fog', 'Greece', 'Early autumn, monasteries rising out of valley fog. Daytime permit already handled.', 39.7217, 21.6306, 'moderate', array['architecture','fog'], '2026-11-15', true)
    returning id into b3;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Ittoqqortoormiit · harbor at ice-break', 'Greenland', 'World''s most remote settlement, colored houses against sea-ice cracking apart.', 70.4859, -21.9624, 'extreme', array['arctic','logistics'], '2026-05-20', true)
    returning id into b4;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Danakil Depression — salt volcanoes', 'Ethiopia', 'Vertical sulphur terraces from 80m. Pilot must carry own cooled battery kit.', 14.2418, 40.2987, 'extreme', array['geothermal','heat'], '2026-12-31', true)
    returning id into b5;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Oodnadatta — post-rain wildflowers', 'Australia', 'After rare inland rain, outback blooms. Window is 9–14 days max.', -27.5547, 135.4474, 'easy', array['seasonal','remote'], '2026-09-10', true)
    returning id into b6;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Nuuk fjord — whales from above', 'Greenland', 'Humpback pods. Must stay 150m+ altitude and not change animal behavior.', 64.1836, -51.7214, 'moderate', array['wildlife','distance rules'], '2026-07-20', true)
    returning id into b7;
  insert into public.bounties (place, country, brief, lat, lon, difficulty, tags, deadline, is_demo)
  values
    ('Lalibela rock-hewn churches', 'Ethiopia', 'Orthodox Christmas pilgrimage, overhead. Requires church permission — we will coordinate.', 12.0317, 39.0473, 'moderate', array['heritage','permits'], '2027-01-15', true)
    returning id into b8;

  -- Seed purse contributions to match the original UI amounts
  insert into public.bounty_purses (bounty_id, amount_usd, is_demo) values
    (b1, 4200, true),
    (b2, 3100, true),
    (b3, 2400, true),
    (b4, 5600, true),
    (b5, 4800, true),
    (b6, 2200, true),
    (b7, 3400, true),
    (b8, 2800, true);

  raise notice 'seeded 8 demo bounties + matching purses';
end $$;
