-- ============================================================
-- Migration 004: Enable Realtime on tables needed for 2b
-- Run in Supabase SQL Editor
-- ============================================================
 
-- Enable replication for realtime subscriptions
alter publication supabase_realtime add table public.completions;
alter publication supabase_realtime add table public.arc_progress;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.weekly_xp;