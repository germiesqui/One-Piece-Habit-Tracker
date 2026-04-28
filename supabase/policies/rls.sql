-- ============================================================
-- Grand Line Chronicles — Row Level Security Policies
-- Run AFTER 001_schema.sql and 002_seed.sql
-- Safe to re-run: drops all existing policies first
-- ============================================================
 
-- Drop existing policies (idempotent)
drop policy if exists "Characters are publicly readable" on public.characters;
drop policy if exists "Arcs are publicly readable (non-hidden)" on public.arcs;
drop policy if exists "Users can view profiles in their party" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can view party members' profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own party" on public.parties;
drop policy if exists "Authenticated users can create parties" on public.parties;
drop policy if exists "Party admins can update party" on public.parties;
drop policy if exists "Anyone authenticated can look up party by invite code" on public.parties;
drop policy if exists "Users can view tasks of party members" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can update their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;
drop policy if exists "Users can view completions in their party" on public.completions;
drop policy if exists "Users can insert their own completions" on public.completions;
drop policy if exists "Users can view their party arc progress" on public.arc_progress;
drop policy if exists "Users can insert arc progress for their party" on public.arc_progress;
drop policy if exists "Users can update arc progress for their party" on public.arc_progress;
drop policy if exists "Users can view weekly xp in their party" on public.weekly_xp;
drop policy if exists "Users can manage their own weekly xp" on public.weekly_xp;
drop function if exists public.get_my_party_id();
 
 
-- Enable RLS on all user-data tables
alter table public.profiles    enable row level security;
alter table public.parties     enable row level security;
alter table public.tasks       enable row level security;
alter table public.completions enable row level security;
alter table public.arc_progress enable row level security;
alter table public.weekly_xp   enable row level security;
 
-- Characters and arcs are public read
alter table public.characters  enable row level security;
alter table public.arcs        enable row level security;
 
create policy "Characters are publicly readable"
  on public.characters for select using (true);
 
create policy "Arcs are publicly readable (non-hidden)"
  on public.arcs for select using (hidden = false);
 
-- ============================================================
-- PROFILES
-- Use auth.uid() directly — no subquery into profiles to avoid recursion
-- ============================================================
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);
 
-- Separate policy: view profiles that share the same party
-- Uses a security definer function to avoid RLS recursion
create or replace function public.get_my_party_id()
returns uuid language sql security definer stable as $$
  select party_id from public.profiles where id = auth.uid()
$$;
 
create policy "Users can view party members' profiles"
  on public.profiles for select
  using (
    party_id is not null
    and party_id = public.get_my_party_id()
  );
 
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
 
-- ============================================================
-- PARTIES
-- ============================================================
create policy "Users can view their own party"
  on public.parties for select
  using (
    id = public.get_my_party_id()
  );
 
create policy "Authenticated users can create parties"
  on public.parties for insert
  with check (auth.uid() is not null);
 
create policy "Party admins can update party"
  on public.parties for update
  using (
    id in (
      select party_id from public.profiles
      where id = auth.uid() and is_party_admin = true
    )
  );
 
-- Allow reading party by invite code (for joining)
create policy "Anyone authenticated can look up party by invite code"
  on public.parties for select
  using (auth.uid() is not null);
 
-- ============================================================
-- TASKS
-- ============================================================
create policy "Users can view tasks of party members"
  on public.tasks for select
  using (
    user_id in (
      select id from public.profiles
      where party_id = public.get_my_party_id()
    )
  );
 
create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);
 
create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);
 
create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);
 
-- ============================================================
-- COMPLETIONS
-- ============================================================
create policy "Users can view completions in their party"
  on public.completions for select
  using (
    party_id = public.get_my_party_id()
  );
 
create policy "Users can insert their own completions"
  on public.completions for insert
  with check (auth.uid() = user_id);
 
-- ============================================================
-- ARC PROGRESS
-- ============================================================
create policy "Users can view their party arc progress"
  on public.arc_progress for select
  using (
    party_id = public.get_my_party_id()
  );
 
create policy "Users can insert arc progress for their party"
  on public.arc_progress for insert
  with check (
    party_id = public.get_my_party_id()
  );
 
create policy "Users can update arc progress for their party"
  on public.arc_progress for update
  using (
    party_id = public.get_my_party_id()
  );
 
-- ============================================================
-- WEEKLY XP
-- ============================================================
create policy "Users can view weekly xp in their party"
  on public.weekly_xp for select
  using (
    party_id = public.get_my_party_id()
  );
 
create policy "Users can manage their own weekly xp"
  on public.weekly_xp for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);