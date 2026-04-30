// ============================================================
// XP System Tests
// Tests all XP calculation, caps, bonuses, streaks, missed days
// ============================================================
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  weeklyBudget,
  dailySoftCapMultiplier,
  calculateXp,
  calcMissedDays,
  secondWindBonus,
  getWeekStart,
  isConsecutiveDay,
  isToday,
  applyClassBonus,
} from '../lib/xp'

// ============================================================
// weeklyBudget
// ============================================================
describe('weeklyBudget', () => {
  it('returns 300 for 1 member', () => expect(weeklyBudget(1)).toBe(300))
  it('returns 300 for 2 members', () => expect(weeklyBudget(2)).toBe(300))
  it('returns 250 for 3 members', () => expect(weeklyBudget(3)).toBe(250))
  it('returns 250 for 4 members', () => expect(weeklyBudget(4)).toBe(250))
  it('returns 220 for 5 members', () => expect(weeklyBudget(5)).toBe(220))
  it('returns 220 for 10 members', () => expect(weeklyBudget(10)).toBe(220))
})

// ============================================================
// dailySoftCapMultiplier
// ============================================================
describe('dailySoftCapMultiplier', () => {
  it('task 1 (0 before) → 100%', () => expect(dailySoftCapMultiplier(0)).toBe(1.0))
  it('task 2 (1 before) → 100%', () => expect(dailySoftCapMultiplier(1)).toBe(1.0))
  it('task 3 (2 before) → 100%', () => expect(dailySoftCapMultiplier(2)).toBe(1.0))
  it('task 4 (3 before) → 50%',  () => expect(dailySoftCapMultiplier(3)).toBe(0.5))
  it('task 5 (4 before) → 50%',  () => expect(dailySoftCapMultiplier(4)).toBe(0.5))
  it('task 6 (5 before) → 25%',  () => expect(dailySoftCapMultiplier(5)).toBe(0.25))
  it('task 10 (9 before) → 25%', () => expect(dailySoftCapMultiplier(9)).toBe(0.25))
})

// ============================================================
// calculateXp
// ============================================================
describe('calculateXp', () => {
  const base = {
    tasksCompletedToday: 0,
    weeklyXpUsed: 0,
    memberCount: 2,
  }

  it('tier 1 training → 10 raw XP, full power, no bounty', () => {
    const r = calculateXp({ ...base, difficulty: 1, taskType: 'training' })
    expect(r.xpRaw).toBe(10)
    expect(r.xpEarned).toBe(10)
    expect(r.powerEarned).toBe(5)
    expect(r.bountyEarned).toBe(0)
    expect(r.countedForParty).toBe(true)
  })

  it('tier 3 immersion → 50 XP, no power, full bounty', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'immersion' })
    expect(r.xpRaw).toBe(50)
    expect(r.powerEarned).toBe(0)
    expect(r.bountyEarned).toBe(25)
  })

  it('tier 3 review → 50 XP, 50/50 split', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'review' })
    expect(r.powerEarned + r.bountyEarned).toBe(25) // 50% of 50
  })

  it('tier 5 → 150 raw XP', () => {
    const r = calculateXp({ ...base, difficulty: 5, taskType: 'study' })
    expect(r.xpRaw).toBe(150)
  })

  it('4th task → 50% XP (soft cap)', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'study', tasksCompletedToday: 3 })
    expect(r.xpEarned).toBe(25) // 50 * 0.5
  })

  it('6th task → 25% XP (hard cap)', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'study', tasksCompletedToday: 5 })
    expect(r.xpEarned).toBe(13) // round(50 * 0.25) = 13
  })

  it('over weekly budget → countedForParty = false, still earns XP', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'study', weeklyXpUsed: 300 })
    expect(r.countedForParty).toBe(false)
    expect(r.xpEarned).toBe(50) // still earns, goes to personal reserve
  })

  it('within weekly budget → countedForParty = true', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'study', weeklyXpUsed: 200 })
    expect(r.countedForParty).toBe(true)
  })

  it('second wind multiplier on first task', () => {
    const r = calculateXp({ ...base, difficulty: 3, taskType: 'study', secondWindMultiplier: 1.5 })
    expect(r.xpEarned).toBe(75) // 50 * 1.5
  })

  it('second wind multiplier does NOT apply after task 3', () => {
    const r = calculateXp({
      ...base, difficulty: 3, taskType: 'study',
      secondWindMultiplier: 1.5,
      tasksCompletedToday: 3, // 4th task, multiplier not applied
    })
    expect(r.xpEarned).toBe(25) // only soft cap applies
  })

  it('Luffy bonus (+15% training) applied correctly', () => {
    const r = calculateXp({
      ...base, difficulty: 3, taskType: 'training',
      bonusType: 'training', bonusPct: 15,
    })
    // power = round(25 * 1.15) = 29
    expect(r.powerEarned).toBe(29)
  })

  it('Sanji bonus (+20% immersion) does not affect training', () => {
    const r = calculateXp({
      ...base, difficulty: 3, taskType: 'training',
      bonusType: 'immersion', bonusPct: 20,
    })
    expect(r.powerEarned).toBe(25) // no bonus
  })

  it('Chopper bonus (+10% all) applies to all task types', () => {
    const r = calculateXp({
      ...base, difficulty: 3, taskType: 'immersion',
      bonusType: 'all', bonusPct: 10,
    })
    // bounty = round(25 * 1.10) = 28
    expect(r.bountyEarned).toBe(28)
  })
})

// ============================================================
// calcMissedDays
// ============================================================
describe('calcMissedDays', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('null lastActiveDate → 0 missed', () => {
    expect(calcMissedDays(null)).toBe(0)
  })

  it('active today → 0 missed', () => {
    const today = new Date('2025-06-15T10:00:00')
    vi.setSystemTime(today)
    expect(calcMissedDays('2025-06-15')).toBe(0)
  })

  it('active yesterday → 0 missed (streak intact)', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(calcMissedDays('2025-06-14')).toBe(0)
  })

  it('2 days ago → 1 missed day', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(calcMissedDays('2025-06-13')).toBe(1)
  })

  it('5 days ago → 4 missed days', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(calcMissedDays('2025-06-10')).toBe(4)
  })

  it('14 days ago → 13 missed days', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(calcMissedDays('2025-06-01')).toBe(13)
  })
})

// ============================================================
// secondWindBonus
// ============================================================
describe('secondWindBonus', () => {
  it('0 missed → no bonus', () => {
    const b = secondWindBonus(0)
    expect(b.partyXpBonus).toBe(0)
    expect(b.personalMultiplier).toBe(1)
    expect(b.message).toBe('')
  })

  it('2 missed → no bonus (threshold is 3)', () => {
    expect(secondWindBonus(2).partyXpBonus).toBe(0)
  })

  it('3 missed → 30 party XP, 1.5x personal', () => {
    const b = secondWindBonus(3)
    expect(b.partyXpBonus).toBe(30)
    expect(b.personalMultiplier).toBe(1.5)
  })

  it('4 missed → 30 party XP', () => {
    expect(secondWindBonus(4).partyXpBonus).toBe(30)
  })

  it('5 missed → 60 party XP', () => {
    expect(secondWindBonus(5).partyXpBonus).toBe(60)
  })

  it('7 missed → 60 party XP', () => {
    expect(secondWindBonus(7).partyXpBonus).toBe(60)
  })

  it('8 missed → 100 party XP', () => {
    expect(secondWindBonus(8).partyXpBonus).toBe(100)
  })

  it('13 missed → 100 party XP', () => {
    expect(secondWindBonus(13).partyXpBonus).toBe(100)
  })

  it('14 missed → 150 party XP', () => {
    expect(secondWindBonus(14).partyXpBonus).toBe(150)
  })

  it('30 missed → 150 party XP (capped)', () => {
    expect(secondWindBonus(30).partyXpBonus).toBe(150)
  })

  it('all messages are non-empty for triggered thresholds', () => {
    [3, 5, 8, 14].forEach(d => {
      expect(secondWindBonus(d).message.length).toBeGreaterThan(0)
    })
  })
})

// ============================================================
// getWeekStart
// ============================================================
describe('getWeekStart', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('Monday → same day', () => {
    vi.setSystemTime(new Date('2025-06-16')) // Monday
    expect(getWeekStart()).toBe('2025-06-16')
  })

  it('Wednesday → previous Monday', () => {
    vi.setSystemTime(new Date('2025-06-18')) // Wednesday
    expect(getWeekStart()).toBe('2025-06-16')
  })

  it('Sunday → previous Monday (6 days back)', () => {
    vi.setSystemTime(new Date('2025-06-22')) // Sunday
    expect(getWeekStart()).toBe('2025-06-16')
  })

  it('Saturday → previous Monday', () => {
    vi.setSystemTime(new Date('2025-06-21')) // Saturday
    expect(getWeekStart()).toBe('2025-06-16')
  })
})

// ============================================================
// isConsecutiveDay / isToday
// ============================================================
describe('isConsecutiveDay', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('yesterday → true', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(isConsecutiveDay('2025-06-14')).toBe(true)
  })

  it('today → false (not yesterday)', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(isConsecutiveDay('2025-06-15')).toBe(false)
  })

  it('2 days ago → false', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(isConsecutiveDay('2025-06-13')).toBe(false)
  })

  it('null → false', () => {
    expect(isConsecutiveDay(null)).toBe(false)
  })
})

describe('isToday', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('today → true', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(isToday('2025-06-15')).toBe(true)
  })

  it('yesterday → false', () => {
    vi.setSystemTime(new Date('2025-06-15'))
    expect(isToday('2025-06-14')).toBe(false)
  })

  it('null → false', () => {
    expect(isToday(null)).toBe(false)
  })
})

// ============================================================
// applyClassBonus
// ============================================================
describe('applyClassBonus', () => {
  const base = { power: 25, bounty: 0 }

  it('matching task type → bonus applied', () => {
    const r = applyClassBonus(base, 'training', 15, 'training')
    expect(r.power).toBe(29) // round(25 * 1.15)
  })

  it('non-matching type → no bonus', () => {
    const r = applyClassBonus(base, 'immersion', 20, 'training')
    expect(r.power).toBe(25)
  })

  it('all bonus type → always applied', () => {
    const r = applyClassBonus({ power: 20, bounty: 20 }, 'all', 10, 'training')
    expect(r.power).toBe(22)
    expect(r.bounty).toBe(22)
  })

  it('0% bonus → no change', () => {
    const r = applyClassBonus(base, 'training', 0, 'training')
    expect(r.power).toBe(25)
  })
})
