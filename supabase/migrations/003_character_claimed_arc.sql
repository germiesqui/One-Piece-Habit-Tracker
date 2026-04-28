-- ============================================================
-- Migration 003: Add character_claimed_arc to profiles
-- Tracks which arc the player claimed their current character on
-- Prevents switching mid-arc (only allowed at arc transitions)
-- ============================================================
 
alter table public.profiles
  add column if not exists character_claimed_arc integer not null default 1;
 