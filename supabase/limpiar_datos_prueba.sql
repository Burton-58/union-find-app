-- =====================================================================
-- Union Find: remove ALL test data created by seed_test_data.sql
-- (everything tied to @seed.test accounts). Your real data is untouched,
-- except enrollments/reviews that involve those fake groups or people.
-- =====================================================================
begin;

delete from public.reviews
 where tutor_id    in (select id from auth.users where email like '%@seed.test')
    or reviewer_id in (select id from auth.users where email like '%@seed.test');

delete from public.enrollments
 where student_id in (select id from auth.users where email like '%@seed.test')
    or post_id in (select id from public.posts
                    where tutor_id in (select id from auth.users where email like '%@seed.test'));

delete from public.posts
 where tutor_id in (select id from auth.users where email like '%@seed.test');

delete from auth.identities where user_id in (select id from auth.users where email like '%@seed.test');
delete from public.profiles where id      in (select id from auth.users where email like '%@seed.test');
delete from auth.users      where email like '%@seed.test';

commit;
