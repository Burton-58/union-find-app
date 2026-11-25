-- =====================================================================
-- Union-Find, parte 4: "tutor" se deriva de tener tutorías
-- Run AFTER 002. Safe to re-run.
--
-- Before: only users whose profiles.role was 'tutor' or 'admin' could be reviewed.
-- Now:    anyone who owns at least one session (posts.tutor_id) is a tutor, so a
--         student who gives a session can also be reviewed. One account is enough
--         to be both student and tutor. The eligibility rule (you attended one of
--         their past sessions) is unchanged and lives in can_review_tutor().
--
-- Only submit_review() changes; the app computes the "tutor" tag itself.
-- =====================================================================

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
