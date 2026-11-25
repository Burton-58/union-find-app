-- =====================================================================
-- Union-Find parte 1: perfiles, RLS e inscripciones (join_post)
-- Paste into Supabase Dashboard -> SQL Editor and run once.
-- Safe to re-run (everything is idempotent).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Create a profile automatically whenever someone signs up
--    (enrollments.student_id -> profiles.id, so without a profile row
--     nobody could ever join a group)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    -- Users can only pick student or tutor at sign-up. 'admin' can never
    -- be self-assigned: sign-up metadata is controlled by the client.
    case when new.raw_user_meta_data ->> 'role' = 'tutor' then 'tutor' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: accounts that signed up before this trigger existed
insert into public.profiles (id, full_name)
select u.id, split_part(u.email, '@', 1)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);


-- ---------------------------------------------------------------------
-- 2. One enrollment per student per group
--    (if this fails with a unique violation you already have duplicate
--     rows in enrollments; delete the extras and re-run)
-- ---------------------------------------------------------------------
do $$
begin
  alter table public.enrollments
    add constraint enrollments_post_student_key unique (post_id, student_id);
exception
  when duplicate_table or duplicate_object then null;
end $$;


-- ---------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.posts       enable row level security;
alter table public.enrollments enable row level security;

-- profiles: any signed-in user can view any profile (it holds no email)
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

-- profiles: you can edit only your own row...
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ...and only the full_name column (so nobody can promote themselves to admin)
revoke update on public.profiles from authenticated, anon;
grant  update (full_name) on public.profiles to authenticated;

-- posts (tutoring groups): readable by any signed-in user
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
  on public.posts for select to authenticated
  using (true);

-- enrollments: readable by signed-in users (needed for rosters + seat counts)
drop policy if exists "enrollments_select_authenticated" on public.enrollments;
create policy "enrollments_select_authenticated"
  on public.enrollments for select to authenticated
  using (true);

-- enrollments: you can remove only your own enrollment (= "leave group").
-- There is deliberately NO insert policy: joining goes through join_post()
-- below, which enforces capacity and the other rules.
drop policy if exists "enrollments_delete_own" on public.enrollments;
create policy "enrollments_delete_own"
  on public.enrollments for delete to authenticated
  using (student_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 4. join_post(): the only way to add yourself to a group
--    Locks the post row so two people can't take the last seat at once.
--    Errors are short codes the app maps to friendly messages.
-- ---------------------------------------------------------------------
create or replace function public.join_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_capacity integer;
  v_tutor    uuid;
  v_date     timestamptz;
  v_taken    integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select capacity, tutor_id, session_date
    into v_capacity, v_tutor, v_date
  from public.posts
  where id = p_post_id
  for update;                       -- serialises concurrent joins per group

  if not found then
    raise exception 'post_not_found';
  end if;

  if v_tutor = v_uid then
    raise exception 'own_post';
  end if;

  if v_date is not null and v_date < now() then
    raise exception 'session_ended';
  end if;

  if exists (
    select 1 from public.enrollments
    where post_id = p_post_id and student_id = v_uid
  ) then
    raise exception 'already_enrolled';
  end if;

  select count(*) into v_taken
  from public.enrollments
  where post_id = p_post_id;

  if v_taken >= v_capacity then
    raise exception 'post_full';
  end if;

  insert into public.enrollments (post_id, student_id)
  values (p_post_id, v_uid);
end;
$$;

revoke all     on function public.join_post(uuid) from public, anon;
grant  execute on function public.join_post(uuid) to authenticated;
