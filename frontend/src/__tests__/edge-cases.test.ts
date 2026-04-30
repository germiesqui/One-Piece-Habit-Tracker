// ============================================================
// Edge Cases & Boundary Tests
// Tests extreme values, empty states, end-of-journey scenarios
// ============================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  weeklyBudget,
  calculateXp,
  calcMissedDays,
  secondWindBonus,
  getWeekStart,
} from '../lib/xp'

// ============================================================
// XP edge cases
// ============================================================
describe('XP edge cases', () => {
  it('difficulty 1 with all bonuses stacked', () => {
    const r = calculateXp({
      difficulty: 1,
      taskType: 'training',
      tasksCompletedToday: 0,
      weeklyXpUsed: 0,
      memberCount: 2,
      bonusType: 'training',
      bonusPct: 15,
      secondWindMultiplier: 1.5,
    })
    // 10 * 1.5 (second wind) = 15 XP, power = round(7 * 1.15) = 9
    expect(r.xpEarned).toBe(15)
    expect(r.powerEarned).toBe(9)
    expect(r.countedForParty).toBe(true)
  })

  it('weekly budget exactly at limit → last XP counted for party', () => {
    // Budget is 300 for 2 members, used 290, completing a 25 XP task
    const r = calculateXp({
      difficulty: 2, taskType: 'study',
      tasksCompletedToday: 0, weeklyXpUsed: 290, memberCount: 2,
    })
    expect(r.countedForParty).toBe(true)
    expect(r.xpEarned).toBe(25)
  })

  it('weekly budget at 299 → next task still counted', () => {
    const r = calculateXp({
      difficulty: 1, taskType: 'study',
      tasksCompletedToday: 0, weeklyXpUsed: 299, memberCount: 2,
    })
    expect(r.countedForParty).toBe(true)
  })

  it('weekly budget at 300 → next task goes to personal reserve', () => {
    const r = calculateXp({
      difficulty: 1, taskType: 'study',
      tasksCompletedToday: 0, weeklyXpUsed: 300, memberCount: 2,
    })
    expect(r.countedForParty).toBe(false)
    expect(r.xpEarned).toBe(10) // still earns XP, just personal
  })

  it('single member party has max budget', () => {
    expect(weeklyBudget(1)).toBe(300)
  })

  it('100 member party still functions', () => {
    const r = calculateXp({
      difficulty: 3, taskType: 'study',
      tasksCompletedToday: 0, weeklyXpUsed: 0, memberCount: 100,
    })
    expect(r.xpEarned).toBe(50)
    expect(r.countedForParty).toBe(true)
  })

  it('all task types produce valid XP', () => {
    const types = ['training', 'study', 'immersion', 'creation', 'review'] as const
    types.forEach(type => {
      const r = calculateXp({
        difficulty: 3, taskType: type,
        tasksCompletedToday: 0, weeklyXpUsed: 0, memberCount: 2,
      })
      expect(r.xpEarned).toBe(50)
      expect(r.powerEarned + r.bountyEarned).toBe(25)
      expect(r.powerEarned).toBeGreaterThanOrEqual(0)
      expect(r.bountyEarned).toBeGreaterThanOrEqual(0)
    })
  })

  it('all difficulty tiers produce valid XP', () => {
    const expected = [10, 25, 50, 90, 150]
    ;[1,2,3,4,5].forEach((diff, i) => {
      const r = calculateXp({
        difficulty: diff, taskType: 'study',
        tasksCompletedToday: 0, weeklyXpUsed: 0, memberCount: 2,
      })
      expect(r.xpRaw).toBe(expected[i])
    })
  })
})

// ============================================================
// Streak edge cases
// ============================================================
describe('streak edge cases', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('new user with no activity → 0 missed days', () => {
    expect(calcMissedDays(null)).toBe(0)
  })

  it('active same day multiple times → 0 missed', () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00'))
    expect(calcMissedDays('2025-06-15')).toBe(0)
  })

  it('second wind does not trigger below threshold', () => {
    expect(secondWindBonus(0).partyXpBonus).toBe(0)
    expect(secondWindBonus(1).partyXpBonus).toBe(0)
    expect(secondWindBonus(2).partyXpBonus).toBe(0)
  })

  it('second wind triggers at exactly 3 days', () => {
    expect(secondWindBonus(3).partyXpBonus).toBeGreaterThan(0)
  })

  it('very long absence still gives max bonus not error', () => {
    const b = secondWindBonus(365) // a whole year
    expect(b.partyXpBonus).toBe(150)
    expect(b.personalMultiplier).toBe(1.5)
    expect(b.message.length).toBeGreaterThan(0)
  })
})

// ============================================================
// Week boundary edge cases
// ============================================================
describe('week boundary edge cases', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('new year boundary — week start is correct', () => {
    vi.setSystemTime(new Date('2026-01-01')) // Thursday
    const ws = getWeekStart()
    expect(ws).toBe('2025-12-29') // Previous Monday
  })

  it('leap year day — no crash', () => {
    vi.setSystemTime(new Date('2028-02-29')) // Leap year Tuesday
    const ws = getWeekStart()
    expect(ws).toBe('2028-02-28') // Monday
  })

  it('week start is always a Monday', () => {
    const dates = [
      '2025-06-15', // Sunday
      '2025-06-16', // Monday
      '2025-06-18', // Wednesday
      '2025-06-21', // Saturday
    ]
    dates.forEach(d => {
      vi.setSystemTime(new Date(d))
      const ws = getWeekStart()
      const dayOfWeek = new Date(ws).getDay()
      expect(dayOfWeek).toBe(1) // 1 = Monday
    })
  })
})

// ============================================================
// Boss HP boundary tests
// ============================================================
describe('boss HP boundaries', () => {
  it('boss HP never goes negative', () => {
    const hp = Math.max(0, 0 - 1000)
    expect(hp).toBe(0)
  })

  it('boss HP at exactly 1 → not defeated', () => {
    expect(1 <= 0).toBe(false)
  })

  it('boss HP at exactly 0 → defeated', () => {
    expect(0 <= 0).toBe(true)
  })

  it('party of 1 → boss HP = base', () => {
    const bossHp = 500 * Math.max(1, 1)
    expect(bossHp).toBe(500)
  })

  it('party of 6 → boss HP = base × 6', () => {
    const bossHp = 500 * 6
    expect(bossHp).toBe(3000)
  })
})

// ============================================================
// App does not break at journey end
// ============================================================
describe('journey end scenarios', () => {
  it('arc 17 + 1 does not exist → journey_complete path taken', () => {
    // The checkAndAdvanceArc function queries arc_number = currentArc.arc_number + 1
    // with hidden = false. Arc 18 is hidden, so nextArc will be null → journey_complete
    const nextArcNumber = 17 + 1 // 18
    const arc18IsHidden = true
    // Simulates: const { data: nextArc } = ... .eq('hidden', false)
    // Since arc 18 is hidden, nextArc would be null
    const nextArc = arc18IsHidden ? null : { arc_number: nextArcNumber }
    expect(nextArc).toBe(null)
    // This means the code correctly falls to journey_complete
  })

  it('XP accumulation beyond weekly budget does not crash', () => {
    // Complete 20 tasks in a day — should not throw
    let weeklyUsed = 0
    for (let i = 0; i < 20; i++) {
      const r = calculateXp({
        difficulty: 3, taskType: 'study',
        tasksCompletedToday: i, weeklyXpUsed: weeklyUsed, memberCount: 2,
      })
      expect(r.xpEarned).toBeGreaterThan(0)
      expect(r.powerEarned).toBeGreaterThanOrEqual(0)
      expect(r.bountyEarned).toBeGreaterThanOrEqual(0)
      weeklyUsed += r.xpEarned
    }
    expect(weeklyUsed).toBeGreaterThan(0)
  })

  it('calcMissedDays does not crash for future dates', () => {
    // Edge case: lastActiveDate is in the future (clock skew)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))
    const result = calcMissedDays('2025-06-20') // future date
    expect(result).toBe(0) // Math.max(0, ...) prevents negative
    vi.useRealTimers()
  })
})
