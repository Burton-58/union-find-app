-- =====================================================================
-- Union-Find: create a DUMMY ADMIN account for testing
-- (do NOT run on a production project)
-- Paste into Supabase Dashboard -> SQL Editor and run.
--
-- Why this has to be SQL: handle_new_user() (001) forces every sign-up to
-- 'student' or 'tutor', and the client can't UPDATE profiles.role, so an
-- admin can only be made from here (postgres role).
--
-- Safe to re-run:
--   * email doesn't exist -> creates a confirmed login + admin profile
--   * email already exists -> just promotes that account to admin
--     (password and name are left untouched)
--
-- Default login:   admin@unionfind.test  /  Admin123!
-- (different domain than @seed.test on purpose, so re-running
--  seed_datos_prueba.sql or limpiar_datos_prueba.sql won't delete it)
-- =====================================================================

do $$
declare
  v_email    text := 'admin@unionfind.test';   -- <-- change if you like
  v_password text := 'Admin123!';              -- <-- only used when creating
  v_name     text := 'Admin de Prueba';
  v_uid      uuid;
begin
  select id into v_uid from auth.users where email = v_email;

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_name),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );

    raise notice 'Created % (password: %)', v_email, v_password;
  else
    raise notice '% already exists, promoting it to admin (password unchanged)', v_email;
  end if;

  -- The sign-up trigger already made a 'student' profile for new users;
  -- this upsert turns it into an admin (and covers old users with no profile).
  insert into public.profiles (id, full_name, role)
  values (v_uid, v_name, 'admin')
  on conflict (id) do update set role = 'admin';
end $$;

-- Check: every admin account in the project
select u.email, p.full_name, p.role, u.email_confirmed_at is not null as email_confirmed
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
order by u.email;


-- ---------------------------------------------------------------------
-- To remove this dummy admin later (uncomment and run):
-- ---------------------------------------------------------------------
-- begin;
--   delete from public.profiles   where id in (select id from auth.users where email = 'admin@unionfind.test');
--   delete from auth.identities   where user_id in (select id from auth.users where email = 'admin@unionfind.test');
--   delete from auth.users        where email = 'admin@unionfind.test';
-- commit;
