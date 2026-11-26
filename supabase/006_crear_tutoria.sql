-- =====================================================================
-- Union-Find, parte 6: cualquier usuario puede crear una tutoría
-- Run AFTER 001-005 (Supabase Dashboard -> SQL Editor). Safe to re-run.
--
-- Before: nothing in the app could insert into public.posts (only the seed
--         script did), so a student had no way to start a session.
-- Now:    create_post() lets ANY signed-in user publish a session. Owning a
--         session is what makes someone a "tutor" (see 004 and
--         lib/tutorias_db.ts -> calcularEsTutor), so the account stays
--         role = 'student' and the app shows "Estudiante y Tutor".
--         profiles.role is NOT touched: it stays un-updatable from the
--         client (see 001), so nobody can promote themselves to admin.
--
-- Design notes:
--   * Same pattern as join_post()/submit_review(): there is deliberately NO
--     insert policy on posts. Writing goes through this SECURITY DEFINER
--     function, so the rules below can't be bypassed by calling the API
--     directly, and tutor_id is always the caller (can't create sessions
--     in someone else's name).
--   * Only columns that the seed script also writes are used
--     (id, tutor_id, subject, capacity, session_date); created_at keeps
--     its table default.
--   * Limits (50 seats, 10 open sessions per user) are anti-spam guards,
--     same idea as the "max 5 open requests" rule in 003. Change the
--     numbers here AND in lib/tutorias.ts if you want different ones.
--
-- Errors (short codes the app maps to friendly messages):
--   not_authenticated, profile_not_found, invalid_subject, invalid_capacity,
--   date_required, date_in_past, too_many_open
-- =====================================================================

create or replace function public.create_post(
  p_subject      text,
  p_capacity     integer,
  p_session_date timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_subject text := btrim(coalesce(p_subject, ''));
  v_open    integer;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Lock the caller's profile row so two simultaneous requests from the same
  -- user can't both slip under the "open sessions" limit.
  perform 1 from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if char_length(v_subject) not between 3 and 100 then
    raise exception 'invalid_subject';
  end if;

  if p_capacity is null or p_capacity not between 1 and 50 then
    raise exception 'invalid_capacity';
  end if;

  -- A date is required: sessions can't be edited afterwards, and a session
  -- without a date could never finish (so it could never be reviewed).
  if p_session_date is null then
    raise exception 'date_required';
  end if;
  if p_session_date <= now() then
    raise exception 'date_in_past';
  end if;

  select count(*) into v_open
  from public.posts
  where tutor_id = v_uid
    and (session_date is null or session_date > now());

  if v_open >= 10 then
    raise exception 'too_many_open';
  end if;

  insert into public.posts (id, tutor_id, subject, capacity, session_date)
  values (gen_random_uuid(), v_uid, v_subject, p_capacity, p_session_date)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all     on function public.create_post(text, integer, timestamptz) from public, anon;
grant  execute on function public.create_post(text, integer, timestamptz) to authenticated;
