create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

alter table public.sites enable row level security;

create policy "Users can view their own sites"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "Users can add their own sites"
  on public.sites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own sites"
  on public.sites for delete
  using (auth.uid() = user_id);
