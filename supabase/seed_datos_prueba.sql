-- =====================================================================
-- Union Find: TEST DATA  (do NOT run on a production project)
-- Paste into Supabase Dashboard -> SQL Editor and run.
-- Safe to re-run: it wipes the previous test data first.
-- Run it AFTER migrations 001 and 002.
--
-- Creates (all emails end in @seed.test, password: Password123!):
--   3 tutors, 6 students, 1 admin, 11 groups (5 past, 6 upcoming),
--   enrollments, and reviews. Dates are relative to "now", so
--   re-running refreshes them.
--
-- Handy situations it contains:
--   * a FULL group (Organic Chemistry Review, 3/3)
--   * an almost-full group (Eigenvalues, 3/4)
--   * a group with no date yet ("Date TBD")
--   * a tutor with no reviews (Priya) whose past session has attendees
--
-- To remove everything again: run supabase/limpiar_datos_prueba.sql
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Wipe any previous test data
-- ---------------------------------------------------------------------
delete from public.reviews
 where tutor_id    in (select id from auth.users where email like '%@seed.test')
    or reviewer_id in (select id from auth.users where email like '%@seed.test');

delete from public.enrollments
 where student_id in (select id from auth.users where email like '%@seed.test')
    or post_id in (select id from public.posts
                    where tutor_id in (select id from auth.users where email like '%@seed.test'));

delete from public.posts
 where tutor_id in (select id from auth.users where email like '%@seed.test');

delete from auth.identities
 where user_id in (select id from auth.users where email like '%@seed.test');
delete from public.profiles
 where id in (select id from auth.users where email like '%@seed.test');
delete from auth.users where email like '%@seed.test';


-- ---------------------------------------------------------------------
-- 1. People
-- ---------------------------------------------------------------------
create temp table seed_people (id uuid, email text, full_name text, role text) on commit drop;
insert into seed_people values
  ('11111111-0000-4000-8000-000000000001', 'tina.torres@seed.test',   'Tina Torres',   'tutor'),
  ('11111111-0000-4000-8000-000000000002', 'marco.quesada@seed.test', 'Marco Quesada', 'tutor'),
  ('11111111-0000-4000-8000-000000000003', 'priya.nair@seed.test',    'Priya Nair',    'tutor'),
  ('11111111-0000-4000-8000-000000000011', 'ana.mora@seed.test',      'Ana Mora',      'student'),
  ('11111111-0000-4000-8000-000000000012', 'luis.vargas@seed.test',   'Luis Vargas',   'student'),
  ('11111111-0000-4000-8000-000000000013', 'sofia.jimenez@seed.test', 'Sofía Jiménez', 'student'),
  ('11111111-0000-4000-8000-000000000014', 'diego.rojas@seed.test',   'Diego Rojas',   'student'),
  ('11111111-0000-4000-8000-000000000015', 'valeria.castro@seed.test','Valeria Castro','student'),
  ('11111111-0000-4000-8000-000000000016', 'mateo.chaves@seed.test',  'Mateo Chaves',  'student'),
  ('11111111-0000-4000-8000-000000000021', 'ada.admin@seed.test',     'Ada Admin',     'admin');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name, 'role', role),
  now(), now(), '', '', '', ''
from seed_people;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from seed_people;

-- Profiles explicitly (don't depend on the sign-up trigger; also sets 'admin')
insert into public.profiles (id, full_name, role)
select id, full_name, role from seed_people
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;


-- ---------------------------------------------------------------------
-- 2. Groups
-- ---------------------------------------------------------------------
-- day(n, h) = n days from today at hour h (negative n = in the past)
create temp table seed_posts (id uuid, tutor_id uuid, subject text, capacity int, session_date timestamptz) on commit drop;
insert into seed_posts values
  -- past sessions
  ('22222222-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','Calculus I: Limits',                6, date_trunc('day', now()) + interval '-14 days' + interval '15 hours'),
  ('22222222-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001','Calculus I: Derivatives',           6, date_trunc('day', now()) + interval '-7 days'  + interval '15 hours'),
  ('22222222-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','Linear Algebra Basics',             5, date_trunc('day', now()) + interval '-3 days'  + interval '17 hours'),
  ('22222222-0000-4000-8000-000000000004','11111111-0000-4000-8000-000000000002','Mechanics: Newton''s Laws',         8, date_trunc('day', now()) + interval '-10 days' + interval '14 hours'),
  ('22222222-0000-4000-8000-000000000005','11111111-0000-4000-8000-000000000003','Intro to Python',                  10, date_trunc('day', now()) + interval '-5 days'  + interval '16 hours'),
  -- upcoming sessions
  ('22222222-0000-4000-8000-000000000006','11111111-0000-4000-8000-000000000001','Calculus II: Integrals',            6, date_trunc('day', now()) + interval '2 days'   + interval '15 hours'),
  ('22222222-0000-4000-8000-000000000007','11111111-0000-4000-8000-000000000001','Linear Algebra: Eigenvalues',       4, date_trunc('day', now()) + interval '5 days'   + interval '17 hours'),
  ('22222222-0000-4000-8000-000000000008','11111111-0000-4000-8000-000000000002','Organic Chemistry Review',          3, date_trunc('day', now()) + interval '3 days'   + interval '13 hours'),
  ('22222222-0000-4000-8000-000000000009','11111111-0000-4000-8000-000000000002','Thermodynamics',                    8, date_trunc('day', now()) + interval '9 days'   + interval '14 hours'),
  ('22222222-0000-4000-8000-000000000010','11111111-0000-4000-8000-000000000003','Data Structures: Trees',           10, date_trunc('day', now()) + interval '4 days'   + interval '16 hours'),
  ('22222222-0000-4000-8000-000000000011','11111111-0000-4000-8000-000000000003','Study Skills Workshop (date TBD)', 20, null);

insert into public.posts (id, tutor_id, subject, capacity, session_date)
select id, tutor_id, subject, capacity, session_date from seed_posts;


-- ---------------------------------------------------------------------
-- 3. Enrollments  (post number -> students; 11..16 = Ana..Mateo)
-- ---------------------------------------------------------------------
insert into public.enrollments (post_id, student_id)
select ('22222222-0000-4000-8000-0000000000' || lpad(p::text, 2, '0'))::uuid,
       ('11111111-0000-4000-8000-0000000000' || s::text)::uuid
from (values
  -- past
  (1,'11'),(1,'12'),(1,'13'),(1,'14'),
  (2,'11'),(2,'12'),(2,'15'),
  (3,'11'),(3,'13'),(3,'16'),
  (4,'12'),(4,'14'),(4,'15'),(4,'16'),
  (5,'11'),(5,'13'),(5,'15'),
  -- upcoming
  (6,'11'),(6,'14'),
  (7,'12'),(7,'13'),(7,'16'),           -- 3/4  almost full
  (8,'11'),(8,'12'),(8,'15'),           -- 3/3  FULL
  (9,'13'),
  (10,'12'),(10,'16')
) as e(p, s);


-- ---------------------------------------------------------------------
-- 4. Reviews (each reviewer attended a past session of that tutor)
-- ---------------------------------------------------------------------
insert into public.reviews (tutor_id, reviewer_id, rating, comment, created_at, updated_at)
select ('11111111-0000-4000-8000-0000000000' || t)::uuid,
       ('11111111-0000-4000-8000-0000000000' || r)::uuid,
       rating, comment,
       now() - (days || ' days')::interval, now() - (days || ' days')::interval
from (values
  ('01','11', 5, 'Tina explains limits so clearly that it finally clicked. Great examples.', 13),
  ('01','12', 4, 'Very helpful, though we ran a bit over time.',                              6),
  ('01','13', 5, 'Patient, prepared and answers every question. Highly recommend!',            2),
  ('01','14', 3, 'Good content but the pace was too fast for me.',                            12),
  ('01','16', 5, null,                                                                         2),
  ('02','12', 4, 'Solid physics intuition. Loved the real-world examples.',                    9),
  ('02','14', 5, 'Best physics tutoring I''ve had. Worth every minute.',                       9),
  ('02','15', 4, 'Clear explanations and good practice problems.',                             8),
  ('02','16', 3, 'Helpful, but I needed more time on the problem set.',                        8)
) as r(t, r, rating, comment, days);

commit;


-- ---------------------------------------------------------------------
-- 5. OPTIONAL: set up YOUR own account for testing.
--    Put the email you signed up with below, then run this block.
--    It enrolls you in two PAST sessions so you can leave reviews
--    (Tina's "Calculus I: Derivatives" and Priya's "Intro to Python").
--    Priya has no reviews yet, so you'd be her first.
--    (Upcoming groups are open for you to join from the app as usual.)
-- ---------------------------------------------------------------------
do $$
declare
  v_email text := 'CHANGE_ME@example.com';      -- <-- your email here
  v_uid   uuid;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise notice 'No user with email %, skipping personal setup (edit v_email above).', v_email;
    return;
  end if;

  insert into public.enrollments (post_id, student_id)
  select p, v_uid
  from (values ('22222222-0000-4000-8000-000000000002'::uuid),
               ('22222222-0000-4000-8000-000000000005'::uuid)) as x(p)
  where not exists (select 1 from public.enrollments e where e.post_id = x.p and e.student_id = v_uid);

  raise notice 'Done: % can now review Tina Torres and Priya Nair.', v_email;
end $$;
