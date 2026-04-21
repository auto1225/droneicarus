-- Drone Icarus — Row Level Security policies
-- Enable RLS on every table; default deny; allow specific cases.

-- =========================================
-- ENABLE RLS
-- =========================================
alter table profiles             enable row level security;
alter table locations            enable row level security;
alter table videos               enable row level security;
alter table collections          enable row level security;
alter table collection_items     enable row level security;
alter table follows              enable row level security;
alter table likes                enable row level security;
alter table comments             enable row level security;
alter table orders               enable row level security;
alter table payouts              enable row level security;
alter table reviews              enable row level security;
alter table conversations        enable row level security;
alter table conversation_members enable row level security;
alter table messages             enable row level security;
alter table notifications        enable row level security;

-- =========================================
-- PROFILES — public read, self write
-- =========================================
create policy profiles_select on profiles for select using (true);

create policy profiles_insert_self on profiles for insert with check (auth.uid() = id);
create policy profiles_update_self on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- =========================================
-- LOCATIONS — public read; admin write (via service role only)
-- =========================================
create policy locations_select on locations for select using (true);

-- =========================================
-- VIDEOS — public sees published; owner sees own drafts; owner writes own
-- =========================================
create policy videos_select_public on videos for select
  using (status = 'published' or auth.uid() = owner_id);

create policy videos_insert_own on videos for insert
  with check (auth.uid() = owner_id);

create policy videos_update_own on videos for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy videos_delete_own on videos for delete
  using (auth.uid() = owner_id);

-- =========================================
-- COLLECTIONS — owner + public unless private
-- =========================================
create policy collections_select_public on collections for select
  using (is_private = false or auth.uid() = owner_id);

create policy collections_insert_own on collections for insert
  with check (auth.uid() = owner_id);

create policy collections_modify_own on collections for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy collections_delete_own on collections for delete
  using (auth.uid() = owner_id);

-- collection_items: visible if parent collection is; writable by owner of collection
create policy collection_items_select on collection_items for select
  using (exists (
    select 1 from collections c
    where c.id = collection_id
      and (c.is_private = false or auth.uid() = c.owner_id)
  ));

create policy collection_items_write on collection_items for all
  using (exists (
    select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()
  ));

-- =========================================
-- FOLLOWS — public read, self writes
-- =========================================
create policy follows_select on follows for select using (true);

create policy follows_insert_self on follows for insert
  with check (auth.uid() = follower_id);

create policy follows_delete_self on follows for delete
  using (auth.uid() = follower_id);

-- =========================================
-- LIKES — public read; self writes
-- =========================================
create policy likes_select on likes for select using (true);

create policy likes_insert_self on likes for insert
  with check (auth.uid() = user_id);

create policy likes_delete_self on likes for delete
  using (auth.uid() = user_id);

-- =========================================
-- COMMENTS — public read; author write
-- =========================================
create policy comments_select on comments for select using (true);

create policy comments_insert_self on comments for insert
  with check (auth.uid() = author_id);

create policy comments_update_self on comments for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy comments_delete_self on comments for delete
  using (auth.uid() = author_id);

-- =========================================
-- ORDERS — buyer sees their own; video owner sees sales on their clips
-- =========================================
create policy orders_select_buyer on orders for select
  using (auth.uid() = buyer_id);

create policy orders_select_seller on orders for select
  using (exists (select 1 from videos v where v.id = video_id and v.owner_id = auth.uid()));

create policy orders_insert_self on orders for insert
  with check (auth.uid() = buyer_id);

-- =========================================
-- PAYOUTS — only the pilot can see theirs
-- =========================================
create policy payouts_select_self on payouts for select
  using (auth.uid() = pilot_id);

-- =========================================
-- REVIEWS — public read; author write
-- =========================================
create policy reviews_select on reviews for select using (true);

create policy reviews_insert_self on reviews for insert
  with check (auth.uid() = author_id);

create policy reviews_update_self on reviews for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy reviews_delete_self on reviews for delete
  using (auth.uid() = author_id);

-- =========================================
-- MESSAGES — only conversation members
-- =========================================
create policy conversations_select_member on conversations for select
  using (exists (select 1 from conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));

create policy conversation_members_select on conversation_members for select
  using (auth.uid() = user_id
         or exists (select 1 from conversation_members m2 where m2.conversation_id = conversation_id and m2.user_id = auth.uid()));

create policy conversation_members_self on conversation_members for insert
  with check (auth.uid() = user_id);

create policy messages_select_member on messages for select
  using (exists (
    select 1 from conversation_members m
    where m.conversation_id = conversation_id and m.user_id = auth.uid()
  ));

create policy messages_insert_member on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversation_members m
      where m.conversation_id = conversation_id and m.user_id = auth.uid()
    )
  );

-- =========================================
-- NOTIFICATIONS — only recipient
-- =========================================
create policy notifications_select_self on notifications for select
  using (auth.uid() = user_id);

create policy notifications_update_self on notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
