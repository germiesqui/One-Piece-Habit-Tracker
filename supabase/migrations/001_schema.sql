-- ============================================================
-- Grand Line Chronicles — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================
 
-- Enable UUID extension
create extension if not exists "uuid-ossp";
 
-- ============================================================
-- CHARACTERS
-- Crew members. Seeded in 002_seed.sql
-- ============================================================
create table public.characters (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  role          text not null,                    -- e.g. "Captain", "Swordsman"
  class_bonus   text not null,                    -- Human-readable description
  bonus_type    text not null,                    -- task type key: 'training','study','immersion','creation','review','all'
  bonus_pct     integer not null default 15,      -- percentage bonus
  unlock_arc    integer not null default 1,       -- arc number when character becomes available
  avatar_emoji  text not null default '🏴‍☠️',
  sort_order    integer not null default 0,
  created_at    timestamptz default now()
);
 
-- ============================================================
-- ARCS
-- Story arcs seeded in 002_seed.sql
-- ============================================================
create table public.arcs (
  id              uuid primary key default uuid_generate_v4(),
  arc_number      integer not null unique,
  name            text not null,
  location        text not null,
  boss_name       text,
  boss_hp_base    integer not null default 500,   -- multiplied by party size
  duration_weeks  integer not null default 3,
  xp_required     integer not null,               -- total party XP to fill arc bar
  power_required  integer not null default 0,     -- min avg power to unlock boss
  bounty_required integer not null default 0,     -- min avg bounty to unlock boss
  hidden          boolean not null default false, -- true for post-Wano arcs
  arc_order       integer not null,
  flavor_text     text,                           -- story summary shown on map
  created_at      timestamptz default now()
);
 
-- ============================================================
-- PARTIES
-- ============================================================
create table public.parties (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  invite_code     text not null unique default upper(substring(md5(random()::text) from 1 for 6)),
  current_arc_id  uuid references public.arcs(id),
  created_by      uuid,                           -- references auth.users, set after insert
  created_at      timestamptz default now()
);
 
-- ============================================================
-- PROFILES
-- One per auth user. Created automatically on signup via trigger.
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null,
  party_id        uuid references public.parties(id),
  character_id    uuid references public.characters(id),
  -- Stats
  total_xp        integer not null default 0,
  power           integer not null default 0,
  bounty          integer not null default 0,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_active_date date,
  -- Catch-up
  consecutive_missed_days integer not null default 0,
  -- Metadata
  is_party_admin  boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
 
-- ============================================================
-- TASKS
-- Personal to each user
-- ============================================================
create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  task_type   text not null check (task_type in ('training','study','immersion','creation','review')),
  difficulty  integer not null check (difficulty between 1 and 5),
  -- difficulty: 1=Den Den(5m), 2=Rookie(15m), 3=Pirate(30m), 4=Supernova(1h), 5=Yonko(2h+)
  repeat_type text not null default 'none' check (repeat_type in ('none','daily','weekly','custom')),
  repeat_days integer[] default '{}',             -- 0=Sun,1=Mon...6=Sat for custom
  is_active   boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
 
-- ============================================================
-- COMPLETIONS
-- One row per task completion event
-- ============================================================
create table public.completions (
  id            uuid primary key default uuid_generate_v4(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  party_id      uuid not null references public.parties(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  xp_earned     integer not null default 0,       -- after cap applied
  xp_raw        integer not null default 0,       -- before cap
  power_earned  integer not null default 0,
  bounty_earned integer not null default 0,
  counted_for_party boolean not null default true -- false if over weekly budget
);
 
-- ============================================================
-- ARC PROGRESS
-- One row per party per arc
-- ============================================================
create table public.arc_progress (
  id              uuid primary key default uuid_generate_v4(),
  party_id        uuid not null references public.parties(id) on delete cascade,
  arc_id          uuid not null references public.arcs(id),
  status          text not null default 'locked'
                  check (status in ('locked','active','boss_unlocked','boss_active','completed')),
  progress_xp     integer not null default 0,     -- accumulated toward xp_required
  boss_current_hp integer,                        -- null until boss_active
  boss_started_at timestamptz,
  boss_ended_at   timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz default now(),
  unique(party_id, arc_id)
);
 
-- ============================================================
-- WEEKLY XP TRACKING
-- Tracks per-user weekly budget consumption
-- ============================================================
create table public.weekly_xp (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  party_id    uuid not null references public.parties(id) on delete cascade,
  week_start  date not null,                      -- Monday of the week
  xp_used     integer not null default 0,         -- toward party budget
  xp_personal integer not null default 0,         -- overflow (personal only)
  tasks_today integer not null default 0,         -- resets each day via app logic
  unique(user_id, week_start)
);
 
-- ============================================================
-- HELPER VIEWS
-- ============================================================
 
-- Party members with their character info
create or replace view public.party_members as
  select
    p.id,
    p.username,
    p.party_id,
    p.character_id,
    p.total_xp,
    p.power,
    p.bounty,
    p.current_streak,
    p.longest_streak,
    p.last_active_date,
    p.is_party_admin,
    c.name as character_name,
    c.role as character_role,
    c.avatar_emoji,
    c.bonus_type,
    c.bonus_pct
  from public.profiles p
  left join public.characters c on c.id = p.character_id;
 
-- ============================================================
-- TRIGGERS
-- ============================================================
 
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
 
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
 
-- Update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
 
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
 
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();