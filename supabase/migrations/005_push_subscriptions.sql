-- ============================================================
-- Migration 005: Push notification subscriptions
-- ============================================================
 
create table public.push_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  party_id     uuid references public.parties(id) on delete cascade,
  subscription jsonb not null,  -- full PushSubscription JSON from browser
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(user_id)               -- one subscription per user (latest wins)
);
 
alter table public.push_subscriptions enable row level security;
 
create policy "Users can manage their own push subscription"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
 
-- Edge function needs to read all subscriptions
-- Grant read access via service role (used in edge function)