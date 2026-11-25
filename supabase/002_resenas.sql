-- =====================================================================
-- Union-Find, parte 2: reseñas de tutores
-- Run AFTER 001. Safe to re-run.
--
-- Rules:
--   * You can review a tutor only if you were enrolled in one of their
--     sessions and that session's date has passed.
--   * You can't review yourself.
--   * One review per student per tutor (submitting again edits it).
--   * Everyone signed in can read reviews. You can delete your own;
--     admins can delete any (moderation).
-- =====================================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  tutor_id    uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (comment is null or length(comment) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint reviews_one_per_pair unique (tutor_id, reviewer_id),
  constraint reviews_not_self check (tutor_id <> reviewer_id)
);

create index if not exists reviews_tutor_created_idx
  on public.reviews (tutor_id, created_at desc);

alter table public.reviews enable row level security;

-- Reads: any signed-in user
drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_authenticated"
  on public.reviews for select to authenticated
  using (true);

-- Deletes: your own review, or any review if you're an admin.
-- (There are deliberately no insert/update policies: writing goes through
--  submit_review() below so the eligibility rules can't be bypassed.)
drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin"
  on public.reviews for delete to authenticated
  using (
    reviewer_id = (select auth.uid())
    or (select p.role from public.profiles p where p.id = (select auth.uid())) = 'admin'
  );

revoke insert, update on public.reviews from authenticated, anon;
revoke all on public.reviews from anon;


-- ---------------------------------------------------------------------
-- can_review_tutor(): single source of truth for eligibility.
-- The app calls it to decide whether to show the form; submit_review()
-- calls it again to enforce the rule.
-- ---------------------------------------------------------------------
create or replace function public.can_review_tutor(p_tutor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and auth.uid() <> p_tutor_id
    and exists (
      select 1
      from public.enrollments e
      join public.posts p on p.id = e.post_id
      where e.student_id = auth.uid()
        and p.tutor_id   = p_tutor_id
        and p.session_date is not null
        and p.session_date < now()
    );
$$;

revoke all     on function public.can_review_tutor(uuid) from public, anon;
grant  execute on function public.can_review_tutor(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- submit_review(): create or edit your review of a tutor
-- ---------------------------------------------------------------------
create or replace function public.submit_review(
  p_tutor_id uuid,
  p_rating   integer,
  p_comment  text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if v_uid = p_tutor_id then raise exception 'cannot_review_self'; end if;

  -- Being a tutor is derived from owning sessions (posts), not from profiles.role.
  -- can_review_tutor() below already requires that you attended one of their sessions.
  if not exists (select 1 from public.profiles where id = p_tutor_id) then
    raise exception 'tutor_not_found';
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'invalid_rating';
  end if;
  if v_comment is not null and length(v_comment) > 1000 then
    raise exception 'invalid_comment';
  end if;

  if not public.can_review_tutor(p_tutor_id) then
    raise exception 'not_eligible';
  end if;

  insert into public.reviews (tutor_id, reviewer_id, rating, comment)
  values (p_tutor_id, v_uid, p_rating, v_comment)
  on conflict (tutor_id, reviewer_id) do update
    set rating     = excluded.rating,
        comment    = excluded.comment,
        updated_at = now();
end;
$$;

revoke all     on function public.submit_review(uuid, integer, text) from public, anon;
grant  execute on function public.submit_review(uuid, integer, text) to authenticated;


-- ---------------------------------------------------------------------
-- tutor_ratings: average + count per tutor (respects RLS of the caller)
-- ---------------------------------------------------------------------
create or replace view public.tutor_ratings
with (security_invoker = true) as
select
  tutor_id,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*)::integer              as review_count
from public.reviews
group by tutor_id;

revoke all    on public.tutor_ratings from anon;
grant  select on public.tutor_ratings to authenticated;
