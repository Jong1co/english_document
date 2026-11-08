create type public.user_role as enum ('pending', 'editor', 'admin');
create type public.source_type as enum ('manual', 'web', 'youtube', 'document');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role public.user_role not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  type public.source_type not null,
  title text not null check (btrim(title) <> ''),
  url text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sentences (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources (id) on delete restrict,
  sentence text not null check (btrim(sentence) <> ''),
  meaning text not null check (btrim(meaning) <> ''),
  description text,
  search_text text generated always as
    (sentence || ' ' || meaning || ' ' || coalesce(description, '')) stored,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sentences_source_id_idx on public.sentences (source_id);
create index sentences_created_at_idx on public.sentences (created_at desc);

create function public.set_updated_at() returns trigger
  language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger sentences_set_updated_at before update on public.sentences
  for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, nullif(btrim(new.raw_user_meta_data ->> 'name'), ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users that existed before this migration (e.g. on a hosted project) get a profile too.
insert into public.profiles (id, email, name)
select id, email, nullif(btrim(raw_user_meta_data ->> 'name'), '')
from auth.users
where email is not null
on conflict (id) do nothing;

create function public.app_role() returns public.user_role
  language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.sentences enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.app_role()) = 'admin');
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using ((select public.app_role()) = 'admin')
  with check ((select public.app_role()) = 'admin');

create policy "sources_managers_all" on public.sources for all to authenticated
  using ((select public.app_role()) in ('editor', 'admin'))
  with check ((select public.app_role()) in ('editor', 'admin'));
create policy "sentences_managers_all" on public.sentences for all to authenticated
  using ((select public.app_role()) in ('editor', 'admin'))
  with check ((select public.app_role()) in ('editor', 'admin'));
