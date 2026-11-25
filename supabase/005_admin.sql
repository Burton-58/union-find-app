-- =====================================================================
-- Union-Find, parte 5: poderes de administrador
-- Run AFTER 001-004 (Supabase Dashboard -> SQL Editor). Safe to re-run.
--
-- What an admin could ALREADY do (002 / 003):
--   * delete any review, delete any tutor request
--   * read everything (all select policies are "any signed-in user")
--
-- What this file adds (before it, all of these failed):
--   * delete any tutoring group (post), including its enrollments
--   * remove any single student from any group
--   * delete any account (profile + auth login + everything it owns)
--
-- Design notes:
--   * Same pattern as join_post()/submit_review(): the dangerous writes go
--     through SECURITY DEFINER functions that check the caller's role, so
--     there is still NO delete policy on posts/profiles and an ordinary
--     user can't do any of this, even by calling the API directly.
--   * profiles.role stays un-updatable from the client (see 001), so nobody
--     can promote themselves. Admins are created from the SQL editor.
--   * The FKs posts->profiles and enrollments->posts/profiles have no
--     ON DELETE action, so the functions delete children first, in order.
-- =====================================================================


-- ---------------------------------------------------------------------
-- is_admin(): true when the caller's profile has role = 'admin'
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke all     on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- Admins can remove any single enrollment (kick a student from a group).
-- Added as a SEPARATE policy so re-running 001 (which recreates
-- "enrollments_delete_own") never conflicts with it.
-- ---------------------------------------------------------------------
drop policy if exists "enrollments_delete_admin" on public.enrollments;
create policy "enrollments_delete_admin"
  on public.enrollments for delete to authenticated
  using ((select public.is_admin()));


-- ---------------------------------------------------------------------
-- admin_delete_post(): delete a tutoring group and its enrollments
-- Errors: not_authenticated, not_admin, post_not_found
-- ---------------------------------------------------------------------
create or replace function public.admin_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_admin() then raise exception 'not_admin'; end if;

  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'post_not_found';
  end if;

  delete from public.enrollments where post_id = p_post_id;
  delete from public.posts       where id      = p_post_id;
end;
$$;

revoke all     on function public.admin_delete_post(uuid) from public, anon;
grant  execute on function public.admin_delete_post(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- admin_delete_user(): delete an account and everything tied to it
--   * enrollments of other students in the groups this user teaches
--   * this user's own enrollments
--   * the groups this user teaches
--   * reviews written by / about this user, tutor requests, profile
--   * the auth login itself (identities + auth.users)
-- Safety: an admin can't delete their own account (avoids locking
-- yourself out). Deleting another admin IS allowed.
-- Errors: not_authenticated, not_admin, cannot_delete_self, user_not_found
-- ---------------------------------------------------------------------
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot_delete_self'; end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found';
  end if;

  delete from public.enrollments
   where post_id in (select id from public.posts where tutor_id = p_user_id);
  delete from public.enrollments    where student_id   = p_user_id;
  delete from public.posts          where tutor_id     = p_user_id;
  delete from public.reviews        where tutor_id     = p_user_id
                                       or reviewer_id  = p_user_id;
  delete from public.tutor_requests where requester_id = p_user_id;
  delete from public.profiles       where id           = p_user_id;

  delete from auth.identities where user_id = p_user_id;
  delete from auth.users      where id      = p_user_id;
end;
$$;

revoke all     on function public.admin_delete_user(uuid) from public, anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;
