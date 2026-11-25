-- =====================================================================
-- Union-Find, parte 3: solicitudes de tutoría ("Solicitar Tutor")
-- Run AFTER 001. Safe to re-run.
--
-- Rules:
--   * Any signed-in user can post a request ("necesito ayuda con X").
--   * Everyone signed in can read requests (so tutors can see what is needed).
--   * You can mark your own request as resolved, or delete it.
--     Admins can delete any (moderation).
--   * At most 5 open requests per user.
-- =====================================================================

create table if not exists public.tutor_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  subject      text not null check (char_length(btrim(subject)) between 3 and 100),
  details      text check (details is null or char_length(details) <= 500),
  status       text not null default 'open' check (status in ('open', 'resolved')),
  created_at   timestamptz not null default now()
);

create index if not exists tutor_requests_status_created_idx
  on public.tutor_requests (status, created_at desc);

alter table public.tutor_requests enable row level security;

drop policy if exists "tutor_requests_select_authenticated" on public.tutor_requests;
create policy "tutor_requests_select_authenticated"
  on public.tutor_requests for select to authenticated using (true);

drop policy if exists "tutor_requests_insert_own" on public.tutor_requests;
create policy "tutor_requests_insert_own"
  on public.tutor_requests for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'open'
    and (select count(*) from public.tutor_requests r
          where r.requester_id = (select auth.uid()) and r.status = 'open') < 5
  );

drop policy if exists "tutor_requests_update_own" on public.tutor_requests;
create policy "tutor_requests_update_own"
  on public.tutor_requests for update to authenticated
  using (requester_id = (select auth.uid()))
  with check (requester_id = (select auth.uid()));

-- Only the status may be changed (not who owns it, nor the text)
revoke update on public.tutor_requests from authenticated, anon;
grant  update (status) on public.tutor_requests to authenticated;

drop policy if exists "tutor_requests_delete_own_or_admin" on public.tutor_requests;
create policy "tutor_requests_delete_own_or_admin"
  on public.tutor_requests for delete to authenticated
  using (
    requester_id = (select auth.uid())
    or exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and p.role = 'admin')
  );

revoke all on public.tutor_requests from anon;
