import type { TaskType, XpResult } from '@/types'
import { DIFFICULTY_TIERS, TASK_TYPES } from '@/types'

// ---- Weekly budget by party size ----
export function weeklyBudget(memberCount: number): number {
  if (memberCount <= 2) return 300
  if (memberCount <= 4) return 250
  return 220
}

// ---- Daily soft cap multiplier ----
// tasksCompletedToday = count BEFORE this task
export function dailySoftCapMultiplier(tasksCompletedToday: number): number {
  if (tasksCompletedToday < 3) return 1.0    // tasks 1-3: 100%
  if (tasksCompletedToday < 5) return 0.5    // tasks 4-5: 50%
  return 0.25                                 // tasks 6+:  25%
}

// ---- Stat split by task type ----
function statSplit(taskType: TaskType, totalStats: number): { power: number; bounty: number } {
  const config = TASK_TYPES.find(t => t.key === taskType)!
  if (config.primaryStat === 'power')  return { power: totalStats, bounty: 0 }
  if (config.primaryStat === 'bounty') return { power: 0, bounty: totalStats }
  // 'both' (review) — 50/50
  const half = Math.floor(totalStats / 2)
  return { power: half, bounty: totalStats - half }
}

// ---- Character class bonus ----
export function applyClassBonus(
  baseStats: { power: number; bounty: number },
  bonusType: string,
  bonusPct: number,
  taskType: TaskType,
): { power: number; bounty: number } {
  const multiplier = 1 + bonusPct / 100

  if (bonusType === 'all') {
    return {
      power:  Math.round(baseStats.power  * multiplier),
      bounty: Math.round(baseStats.bounty * multiplier),
    }
  }
  if (bonusType === taskType) {
    return {
      power:  Math.round(baseStats.power  * multiplier),
      bounty: Math.round(baseStats.bounty * multiplier),
    }
  }
  return baseStats
}

// ---- Main XP calculation ----
export function calculateXp(params: {
  difficulty: number
  taskType: TaskType
  tasksCompletedToday: number
  weeklyXpUsed: number
  memberCount: number
  bonusType?: string
  bonusPct?: number
  // Catch-up: 20% bonus if significantly behind
  catchUpBonus?: boolean
  // Second Wind (return bonus): flat XP bonus for party
  secondWindMultiplier?: number
}): XpResult {
  const tier = DIFFICULTY_TIERS.find(t => t.level === params.difficulty)!
  const xpRaw = tier.baseXp

  // Apply daily soft cap
  const capMultiplier = dailySoftCapMultiplier(params.tasksCompletedToday)
  let xpAfterCap = Math.round(xpRaw * capMultiplier)

  // Apply catch-up bonus (+20% personal)
  if (params.catchUpBonus) {
    xpAfterCap = Math.round(xpAfterCap * 1.2)
  }

  // Apply second wind multiplier (first 3 tasks on return day)
  if (params.secondWindMultiplier && params.tasksCompletedToday < 3) {
    xpAfterCap = Math.round(xpAfterCap * params.secondWindMultiplier)
  }

  // Check weekly budget
  const budget = weeklyBudget(params.memberCount)
  const remaining = Math.max(0, budget - params.weeklyXpUsed)
  const countedForParty = remaining > 0
  const xpEarned = Math.min(xpAfterCap, remaining > 0 ? xpAfterCap : xpAfterCap) // full XP either way

  // Stat split
  const totalStats = Math.round(xpEarned * 0.5) // stats are 50% of XP value
  let stats = statSplit(params.taskType, totalStats)

  // Apply character class bonus
  if (params.bonusType && params.bonusPct) {
    stats = applyClassBonus(stats, params.bonusType, params.bonusPct, params.taskType)
  }

  return {
    xpRaw,
    xpEarned,
    powerEarned: stats.power,
    bountyEarned: stats.bounty,
    countedForParty,
  }
}

// ---- Missed day calculation ----
// Returns how many full calendar days have passed since last_active_date
// e.g. active yesterday → 0 missed, active 3 days ago → 2 missed
export function calcMissedDays(lastActiveDate: string | null): number {
  if (!lastActiveDate) return 0
  const last = new Date(lastActiveDate)
  const today = new Date()
  // Zero out time components for pure date diff
  last.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  // 0 or 1 = active today or yesterday (streak intact), 2+ = missed days
  return Math.max(0, diffDays - 1)
}


export function secondWindBonus(consecutiveMissedDays: number): {
  partyXpBonus: number
  personalMultiplier: number
  message: string
} {
  if (consecutiveMissedDays < 3)  return { partyXpBonus: 0,   personalMultiplier: 1,    message: '' }
  if (consecutiveMissedDays < 5)  return { partyXpBonus: 30,  personalMultiplier: 1.5,  message: 'The crew spotted you on the horizon!' }
  if (consecutiveMissedDays < 8)  return { partyXpBonus: 60,  personalMultiplier: 1.5,  message: 'A returning nakama brings fresh resolve!' }
  if (consecutiveMissedDays < 14) return { partyXpBonus: 100, personalMultiplier: 1.5,  message: 'Like Luffy after two years of training!' }
  return                                  { partyXpBonus: 150, personalMultiplier: 1.5,  message: "The crew is whole again — nothing can stop them!" }
}

// ---- Week start (Monday) ----
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// ---- Streak helpers ----
export function isConsecutiveDay(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false
  const last = new Date(lastActiveDate)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  return last.toDateString() === yesterday.toDateString()
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr).toDateString() === new Date().toDateString()
}