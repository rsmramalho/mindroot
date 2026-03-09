-- 006_public_shares.sql
-- alpha.21: Public sharing — reflections & streaks

create table if not exists public_shares (
  id uuid default gen_random_uuid() primary key,
  token uuid default gen_random_uuid() unique not null,
  content_type text not null check (content_type in ('reflection', 'streak')),
  content_id text not null,
  content_data jsonb,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

alter table public_shares enable row level security;

-- Owner can create their own shares
create policy "Owner can insert own shares"
  on public_shares for insert
  with check (auth.uid() = owner_id);

-- Owner can delete their own shares
create policy "Owner can delete own shares"
  on public_shares for delete
  using (auth.uid() = owner_id);

-- Anyone can read (public access for shared links)
create policy "Anyone can select shares"
  on public_shares for select
  using (true);

-- Indexes
create index if not exists idx_public_shares_owner on public_shares(owner_id);
