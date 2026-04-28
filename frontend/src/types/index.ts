// ============================================================
// Grand Line Chronicles — TypeScript Types
// ============================================================
 
export type TaskType = 'training' | 'study' | 'immersion' | 'creation' | 'review'
export type RepeatType = 'none' | 'daily' | 'weekly' | 'custom'
export type ArcStatus = 'locked' | 'active' | 'boss_unlocked' | 'boss_active' | 'completed'
 
// ---- Difficulty Tier ----
export interface DifficultyTier {
  level: number        // 1–5
  name: string         // Den Den, Rookie, Pirate, Supernova, Yonko
  label: string        // ~5 min, ~15 min, etc.
  baseXp: number
  emoji: string
}
 
export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { level: 1, name: 'Den Den',   label: '~5 min',   baseXp: 10,  emoji: '📟' },
  { level: 2, name: 'Rookie',    label: '~15 min',  baseXp: 25,  emoji: '⚓' },
  { level: 3, name: 'Pirate',    label: '~30 min',  baseXp: 50,  emoji: '🏴‍☠️' },
  { level: 4, name: 'Supernova', label: '~1 hour',  baseXp: 90,  emoji: '⚡' },
  { level: 5, name: 'Yonko',    label: '~2h+',     baseXp: 150, emoji: '👑' },
]
 
// ---- Task Type Config ----
export interface TaskTypeConfig {
  key: TaskType
  label: string
  emoji: string
  primaryStat: 'power' | 'bounty' | 'both'
  description: string
  color: string        // Tailwind color class base
}
 
export const TASK_TYPES: TaskTypeConfig[] = [
  {
    key: 'training',
    label: 'Training',
    emoji: '🗡️',
    primaryStat: 'power',
    description: 'Drills, flashcards, focused practice',
    color: 'wanted',
  },
  {
    key: 'study',
    label: 'Study',
    emoji: '📖',
    primaryStat: 'power',
    description: 'Textbooks, reading, research',
    color: 'sea',
  },
  {
    key: 'immersion',
    label: 'Immersion',
    emoji: '🌊',
    primaryStat: 'bounty',
    description: 'Watching, listening, real-world exposure',
    color: 'sea',
  },
  {
    key: 'creation',
    label: 'Creation',
    emoji: '✍️',
    primaryStat: 'bounty',
    description: 'Writing, speaking, making something',
    color: 'parchment',
  },
  {
    key: 'review',
    label: 'Review',
    emoji: '🔁',
    primaryStat: 'both',
    description: 'Revisiting old material, revision',
    color: 'ink',
  },
]
 
// ---- Database Types ----
export interface Character {
  id: string
  name: string
  role: string
  class_bonus: string
  bonus_type: string
  bonus_pct: number
  unlock_arc: number
  avatar_emoji: string
  sort_order: number
}
 
export interface Arc {
  id: string
  arc_number: number
  name: string
  location: string
  boss_name: string | null
  boss_hp_base: number
  duration_weeks: number
  xp_required: number
  power_required: number
  bounty_required: number
  hidden: boolean
  arc_order: number
  flavor_text: string | null
}
 
export interface Party {
  id: string
  name: string
  invite_code: string
  current_arc_id: string | null
  created_by: string
  created_at: string
}
 
export interface Profile {
  id: string
  username: string
  party_id: string | null
  character_id: string | null
  total_xp: number
  power: number
  bounty: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  consecutive_missed_days: number
  character_claimed_arc: number
  is_party_admin: boolean
  created_at: string
  updated_at: string
}
 
export interface PartyMember extends Profile {
  character_name: string | null
  character_role: string | null
  avatar_emoji: string | null
  bonus_type: string | null
  bonus_pct: number | null
}
 
export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  task_type: TaskType
  difficulty: number
  repeat_type: RepeatType
  repeat_days: number[]
  is_active: boolean
  created_at: string
  updated_at: string
}
 
export interface Completion {
  id: string
  task_id: string
  user_id: string
  party_id: string
  completed_at: string
  xp_earned: number
  xp_raw: number
  power_earned: number
  bounty_earned: number
  counted_for_party: boolean
}
 
export interface ArcProgress {
  id: string
  party_id: string
  arc_id: string
  status: ArcStatus
  progress_xp: number
  boss_current_hp: number | null
  boss_started_at: string | null
  boss_ended_at: string | null
  completed_at: string | null
  created_at: string
}
 
export interface WeeklyXp {
  id: string
  user_id: string
  party_id: string
  week_start: string
  xp_used: number
  xp_personal: number
  tasks_today: number
}
 
// ---- Computed / UI Types ----
export interface PartyDashboardData {
  party: Party
  members: PartyMember[]
  currentArc: Arc | null
  arcProgress: ArcProgress | null
  weeklyXp: WeeklyXp[]
  memberCount: number
  weeklyBudget: number
}
 
export interface TaskFormData {
  title: string
  description: string
  task_type: TaskType
  difficulty: number
  repeat_type: RepeatType
  repeat_days: number[]
}
 
// ---- XP Calculation ----
export interface XpResult {
  xpRaw: number
  xpEarned: number       // after daily soft cap
  powerEarned: number
  bountyEarned: number
  countedForParty: boolean
}