-- 005_push_subscriptions.sql
-- alpha.11: Push notification subscription storage
-- Stores Web Push subscriptions per user + device

create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null default '',
  auth text not null default '',
  created_at timestamptz default now() not null,
  unique(user_id, endpoint)
);

-- RLS: users can only see/manage their own subscriptions
alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for querying by user
create index if not exists idx_push_subscriptions_user_id
  on push_subscriptions(user_id);
