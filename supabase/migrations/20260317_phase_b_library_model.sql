begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid null references public.artists(id) on delete set null,
  title text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  album_id uuid null references public.albums(id) on delete set null,
  title text not null,
  project_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_artists_updated_at on public.artists;
create trigger set_artists_updated_at
before update on public.artists
for each row
execute function public.set_updated_at();

drop trigger if exists set_albums_updated_at on public.albums;
create trigger set_albums_updated_at
before update on public.albums
for each row
execute function public.set_updated_at();

drop trigger if exists set_songs_updated_at on public.songs;
create trigger set_songs_updated_at
before update on public.songs
for each row
execute function public.set_updated_at();

create index if not exists artists_user_id_idx on public.artists(user_id);
create index if not exists artists_user_name_idx on public.artists(user_id, lower(name));

create index if not exists albums_user_id_idx on public.albums(user_id);
create index if not exists albums_artist_id_idx on public.albums(artist_id);
create index if not exists albums_user_title_idx on public.albums(user_id, lower(title));
create index if not exists albums_user_artist_title_idx on public.albums(user_id, artist_id, lower(title));

create index if not exists songs_user_id_idx on public.songs(user_id);
create index if not exists songs_album_id_idx on public.songs(album_id);
create index if not exists songs_user_title_idx on public.songs(user_id, lower(title));
create index if not exists songs_user_album_title_idx on public.songs(user_id, album_id, lower(title));

alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.songs enable row level security;

drop policy if exists "artists_select_own" on public.artists;
create policy "artists_select_own"
on public.artists
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "artists_insert_own" on public.artists;
create policy "artists_insert_own"
on public.artists
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "artists_update_own" on public.artists;
create policy "artists_update_own"
on public.artists
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "artists_delete_own" on public.artists;
create policy "artists_delete_own"
on public.artists
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "albums_select_own" on public.albums;
create policy "albums_select_own"
on public.albums
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "albums_insert_own" on public.albums;
create policy "albums_insert_own"
on public.albums
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    artist_id is null
    or exists (
      select 1
      from public.artists a
      where a.id = artist_id
        and a.user_id = auth.uid()
    )
  )
);

drop policy if exists "albums_update_own" on public.albums;
create policy "albums_update_own"
on public.albums
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    artist_id is null
    or exists (
      select 1
      from public.artists a
      where a.id = artist_id
        and a.user_id = auth.uid()
    )
  )
);

drop policy if exists "albums_delete_own" on public.albums;
create policy "albums_delete_own"
on public.albums
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "songs_select_own" on public.songs;
create policy "songs_select_own"
on public.songs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "songs_insert_own" on public.songs;
create policy "songs_insert_own"
on public.songs
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    album_id is null
    or exists (
      select 1
      from public.albums al
      where al.id = album_id
        and al.user_id = auth.uid()
    )
  )
);

drop policy if exists "songs_update_own" on public.songs;
create policy "songs_update_own"
on public.songs
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    album_id is null
    or exists (
      select 1
      from public.albums al
      where al.id = album_id
        and al.user_id = auth.uid()
    )
  )
);

drop policy if exists "songs_delete_own" on public.songs;
create policy "songs_delete_own"
on public.songs
for delete
to authenticated
using (auth.uid() = user_id);

commit;
