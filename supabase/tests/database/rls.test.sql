begin;
select plan(17);

-- Fixed ids
--   admin    00000000-0000-0000-0000-0000000000a1
--   editor   00000000-0000-0000-0000-0000000000b1
--   pending  00000000-0000-0000-0000-0000000000c1
--   source   00000000-0000-0000-0000-0000000000d1
--   sentence 00000000-0000-0000-0000-0000000000f1

-- Setup as postgres
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'rls-admin@test.local', 'authenticated', 'authenticated', '{"name": "Admin"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'rls-editor@test.local', 'authenticated', 'authenticated', '{"name": "Editor"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'rls-pending@test.local', 'authenticated', 'authenticated', '{"name": "  "}');

-- Signup trigger
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'), 'pending', 'new user gets pending role');
select is((select name from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'Editor', 'name copied from metadata');

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000b1';
insert into public.sources (id, type, title) values ('00000000-0000-0000-0000-0000000000d1', 'manual', 'RLS source');
insert into public.sentences (id, source_id, sentence, meaning)
  values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000d1', 'Did you sleep well?', '잘 잤어?');

-- anon
set local role anon;
select is((select count(*) from public.sentences)::int, 0, 'anon sees no sentences');

-- pending
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
select is((select count(*) from public.sentences)::int, 0, 'pending sees no sentences');
select throws_ok($$ insert into public.sentences (sentence, meaning) values ('a', 'b') $$, '42501', null, 'pending cannot insert');

-- editor
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated"}', true);
select is((select count(*) from public.sentences where id = '00000000-0000-0000-0000-0000000000f1')::int, 1, 'editor sees sentences');
select lives_ok($$ insert into public.sentences (sentence, meaning) values ('Hi', '안녕') $$, 'editor inserts without source');
select is((select created_by from public.sentences where sentence = 'Hi'), '00000000-0000-0000-0000-0000000000b1'::uuid, 'created_by defaults to auth.uid()');
select ok((select search_text from public.sentences where sentence = 'Hi') like 'Hi 안녕%', 'search_text combines fields');
select lives_ok($$ insert into public.sources (type, title, url) values ('web', 'Blog', 'https://example.com') $$, 'editor inserts source');
update public.sentences set meaning = '안녕하세요' where sentence = 'Hi';
select is((select meaning from public.sentences where sentence = 'Hi'), '안녕하세요', 'editor updates sentence');
select lives_ok($$ delete from public.sentences where sentence = 'Hi' $$, 'editor deletes sentence');
select throws_ok($$ delete from public.sources where id = '00000000-0000-0000-0000-0000000000d1' $$, '23503', null, 'source with sentences cannot be deleted');
select is((select count(*) from public.profiles)::int, 1, 'editor sees only own profile');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000b1';
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'editor', 'editor cannot promote self');

-- admin
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);
select is((select count(*) from public.profiles where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1'))::int, 3, 'admin sees all profiles');
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000c1';
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'), 'editor', 'admin can change roles');

select * from finish();
rollback;
