
-- Anointed Sounds table for admin-managed YouTube videos
create table if not exists public.anointed_sounds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_anointed_sounds()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_anointed_sounds on public.anointed_sounds;
create trigger set_updated_at_anointed_sounds
  before update on public.anointed_sounds
  for each row
  execute function public.set_updated_at_anointed_sounds();

alter table public.anointed_sounds enable row level security;

drop policy if exists "anointed_sounds_public_read" on public.anointed_sounds;
create policy "anointed_sounds_public_read"
  on public.anointed_sounds
  for select
  using (true);

drop policy if exists "anointed_sounds_admin_all" on public.anointed_sounds;
create policy "anointed_sounds_admin_all"
  on public.anointed_sounds
  for all
  using (public.is_admin_email())
  with check (public.is_admin_email());

-- Migrate existing hardcoded videos
insert into public.anointed_sounds (title, youtube_id, sort_order)
select 'Praise', 'f2oxGYpuLkw', 0
where not exists (select 1 from public.anointed_sounds where youtube_id = 'f2oxGYpuLkw');

insert into public.anointed_sounds (title, youtube_id, sort_order)
select 'Worthy of My Praise', 'lrdmnAn9gxk', 1
where not exists (select 1 from public.anointed_sounds where youtube_id = 'lrdmnAn9gxk');
