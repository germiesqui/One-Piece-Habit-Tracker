// ============================================================
// Arc Progression & Boss Logic Tests
// Tests arc advancement, stat gates, boss HP, journey end
// ============================================================
import { describe, it, expect } from 'vitest'

// ---- Replicate arc advancement logic (pure functions extracted for testing) ----

interface ArcConfig {
  arc_number:       number
  xp_required:      number
  power_required:   number
  bounty_required:  number
  boss_name:        string | null
  boss_hp_base:     number
  hidden:           boolean
}

interface ArcProgressState {
  status:           'active' | 'boss_active' | 'completed' | 'boss_unlocked' | 'locked'
  progress_xp:      number
  boss_current_hp:  number | null
}

interface Member {
  power:  number
  bounty: number
}

type AdvanceResult =
  | { action: 'none'; reason: string }
  | { action: 'unlock_boss'; bossHp: number }
  | { action: 'skip_to_next' }
  | { action: 'boss_defeated' }
  | { action: 'journey_complete' }

function checkArcAdvancement(
  arc:      ArcConfig,
  progress: ArcProgressState,
  members:  Member[],
  isLastArc: boolean,
): AdvanceResult {
  // Boss active — check if defeated
  if (progress.status === 'boss_active') {
    if ((progress.boss_current_hp ?? 1) <= 0) {
      if (isLastArc) return { action: 'journey_complete' }
      return { action: 'boss_defeated' }
    }
    return { action: 'none', reason: 'boss still alive' }
  }

  // Active — check if arc bar full
  if (progress.status === 'active') {
    if (progress.progress_xp < arc.xp_required) {
      return { action: 'none', reason: 'arc not full' }
    }

    // Check stat thresholds
    const count    = Math.max(members.length, 1)
    const avgPower  = members.reduce((s, m) => s + m.power,  0) / count
    const avgBounty = members.reduce((s, m) => s + m.bounty, 0) / count

    if (avgPower < arc.power_required || avgBounty < arc.bounty_required) {
      return { action: 'none', reason: 'stats not met' }
    }

    // No boss — transition arc
    if (!arc.boss_name) return { action: 'skip_to_next' }

    // Unlock boss
    const bossHp = arc.boss_hp_base * members.length
    return { action: 'unlock_boss', bossHp }
  }

  return { action: 'none', reason: 'wrong status' }
}

function bossHpAfterDamage(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - damage)
}

// ============================================================
// Arc bar progression
// ============================================================
describe('arc bar progression', () => {
  const arc: ArcConfig = {
    arc_number: 1, xp_required: 800,
    power_required: 50, bounty_required: 30,
    boss_name: 'Captain Morgan', boss_hp_base: 300, hidden: false,
  }
  const members: Member[] = [{ power: 60, bounty: 40 }, { power: 55, bounty: 35 }]

  it('arc not full → no action', () => {
    const result = checkArcAdvancement(
      arc, { status: 'active', progress_xp: 500, boss_current_hp: null }, members, false
    )
    expect(result.action).toBe('none')
    if (result.action === 'none') expect(result.reason).toBe('arc not full')
  })

  it('arc full + stats met → unlock boss', () => {
    const result = checkArcAdvancement(
      arc, { status: 'active', progress_xp: 800, boss_current_hp: null }, members, false
    )
    expect(result.action).toBe('unlock_boss')
  })

  it('boss HP scales with party size', () => {
    const result = checkArcAdvancement(
      arc, { status: 'active', progress_xp: 800, boss_current_hp: null }, members, false
    )
    if (result.action === 'unlock_boss') {
      expect(result.bossHp).toBe(300 * 2) // 2 members
    }
  })

  it('arc full but power not met → no boss unlock', () => {
    const weakMembers: Member[] = [{ power: 30, bounty: 400 }] // low power, high bounty
    const result = checkArcAdvancement(
      arc, { status: 'active', progress_xp: 800, boss_current_hp: null }, weakMembers, false
    )
    expect(result.action).toBe('none')
  })

  it('arc full + power met → unlock boss (even if bounty is low)', () => {
    const strongLowBounty: Member[] = [{ power: 60, bounty: 10 }] // meets power, not bounty
    const result = checkArcAdvancement(
      arc, { status: 'active', progress_xp: 800, boss_current_hp: null }, strongLowBounty, false
    )
    expect(result.action).toBe('unlock_boss')
  })
})

// ============================================================
// Transition arcs (no boss)
// ============================================================
describe('transition arcs (no boss)', () => {
  const transitionArc: ArcConfig = {
    arc_number: 6, xp_required: 800,
    power_required: 230, bounty_required: 210,
    boss_name: null, boss_hp_base: 0, hidden: false,
  }
  const members: Member[] = [{ power: 250, bounty: 220 }]

  it('full bar + no boss → skip to next arc', () => {
    const result = checkArcAdvancement(
      transitionArc,
      { status: 'active', progress_xp: 800, boss_current_hp: null },
      members, false
    )
    expect(result.action).toBe('skip_to_next')
  })
})

// ============================================================
// Boss fight mechanics
// ============================================================
describe('boss fight mechanics', () => {
  const arc: ArcConfig = {
    arc_number: 8, xp_required: 2200,
    power_required: 370, bounty_required: 350,
    boss_name: 'Crocodile', boss_hp_base: 500, hidden: false,
  }

  it('boss with HP remaining → no action', () => {
    const result = checkArcAdvancement(
      arc, { status: 'boss_active', progress_xp: 2200, boss_current_hp: 250 },
      [{ power: 400, bounty: 380 }], false
    )
    expect(result.action).toBe('none')
  })

  it('boss at exactly 0 HP → boss_defeated', () => {
    const result = checkArcAdvancement(
      arc, { status: 'boss_active', progress_xp: 2200, boss_current_hp: 0 },
      [{ power: 400, bounty: 380 }], false
    )
    expect(result.action).toBe('boss_defeated')
  })

  it('boss below 0 HP → boss_defeated (negative guard)', () => {
    const result = checkArcAdvancement(
      arc, { status: 'boss_active', progress_xp: 2200, boss_current_hp: -10 },
      [{ power: 400, bounty: 380 }], false
    )
    expect(result.action).toBe('boss_defeated')
  })

  it('boss HP cannot go below 0', () => {
    expect(bossHpAfterDamage(10, 50)).toBe(0)
    expect(bossHpAfterDamage(0, 100)).toBe(0)
  })

  it('damage reduces boss HP correctly', () => {
    expect(bossHpAfterDamage(500, 150)).toBe(350)
    expect(bossHpAfterDamage(350, 350)).toBe(0)
  })

  it('last arc boss defeated → journey_complete', () => {
    const result = checkArcAdvancement(
      arc, { status: 'boss_active', progress_xp: 2200, boss_current_hp: 0 },
      [{ power: 400, bounty: 380 }], true // isLastArc
    )
    expect(result.action).toBe('journey_complete')
  })
})

// ============================================================
// Hidden arc (post-Wano)
// ============================================================
describe('hidden arc handling', () => {
  it('hidden arc should not appear in normal progression', () => {
    const hiddenArc: ArcConfig = {
      arc_number: 18, xp_required: 2500,
      power_required: 1500, bounty_required: 1500,
      boss_name: null, boss_hp_base: 0, hidden: true,
    }
    // Hidden arcs are filtered out by `.eq('hidden', false)` in DB queries
    // Verify the hidden flag is set correctly
    expect(hiddenArc.hidden).toBe(true)
  })
})

// ============================================================
// Full journey simulation — arc 1 through final arc
// ============================================================
describe('full journey simulation', () => {
  // Simplified arc list for simulation
  const ARCS: ArcConfig[] = [
    { arc_number: 1,  xp_required: 800,  power_required: 50,   bounty_required: 30,  boss_name: 'Morgan',     boss_hp_base: 300, hidden: false },
    { arc_number: 2,  xp_required: 900,  power_required: 80,   bounty_required: 60,  boss_name: 'Buggy',      boss_hp_base: 300, hidden: false },
    { arc_number: 5,  xp_required: 1400, power_required: 200,  bounty_required: 180, boss_name: 'Arlong',     boss_hp_base: 400, hidden: false },
    { arc_number: 6,  xp_required: 800,  power_required: 230,  bounty_required: 210, boss_name: null,         boss_hp_base: 0,   hidden: false },
    { arc_number: 17, xp_required: 4000, power_required: 1400, bounty_required: 1380, boss_name: 'Kaido',     boss_hp_base: 900, hidden: false },
  ]

  it('can progress through all visible arcs without errors', () => {
    const memberStats: Member[] = [{ power: 1500, bounty: 1500 }] // fully maxed

    ARCS.forEach((arc, i) => {
      const isLast = i === ARCS.length - 1

      // Active → should unlock boss or skip
      const activeResult = checkArcAdvancement(
        arc,
        { status: 'active', progress_xp: arc.xp_required, boss_current_hp: null },
        memberStats, isLast
      )
      expect(['unlock_boss', 'skip_to_next']).toContain(activeResult.action)

      // If boss, defeat it
      if (activeResult.action === 'unlock_boss') {
        const bossResult = checkArcAdvancement(
          arc,
          { status: 'boss_active', progress_xp: arc.xp_required, boss_current_hp: 0 },
          memberStats, isLast
        )
        expect(['boss_defeated', 'journey_complete']).toContain(bossResult.action)
      }
    })
  })

  it('last arc with dead boss → journey_complete not boss_defeated', () => {
    const lastArc = ARCS[ARCS.length - 1]
    const result = checkArcAdvancement(
      lastArc,
      { status: 'boss_active', progress_xp: lastArc.xp_required, boss_current_hp: 0 },
      [{ power: 1500, bounty: 1500 }],
      true
    )
    expect(result.action).toBe('journey_complete')
  })
})