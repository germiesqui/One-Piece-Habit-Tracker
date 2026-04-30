// ============================================================
// Auth & Party Flow Tests
// Tests invite codes, party joining, character switching rules
// ============================================================
import { describe, it, expect } from 'vitest'

// ---- Invite code validation ----
function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase())
}

// ---- Character switch eligibility ----
function canSwitchCharacter(
  characterClaimedArc: number,
  currentArcNumber: number,
): boolean {
  return characterClaimedArc < currentArcNumber
}

// ---- Character unlock eligibility ----
function isCharacterUnlocked(
  unlockArc: number,
  currentArcNumber: number,
): boolean {
  return unlockArc <= currentArcNumber
}

// ---- Party size XP budget ----
function partyXpBudget(memberCount: number): number {
  if (memberCount <= 2) return 300
  if (memberCount <= 4) return 250
  return 220
}

// ---- Slug generation (island/boss image paths) ----
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

// ============================================================
describe('invite code validation', () => {
  it('valid 6-char alphanumeric code', () => {
    expect(isValidInviteCode('A3F7K2')).toBe(true)
    expect(isValidInviteCode('ABCDEF')).toBe(true)
    expect(isValidInviteCode('123456')).toBe(true)
  })

  it('lowercase input is normalised', () => {
    expect(isValidInviteCode('a3f7k2')).toBe(true)
  })

  it('too short → invalid', () => {
    expect(isValidInviteCode('ABC')).toBe(false)
    expect(isValidInviteCode('')).toBe(false)
  })

  it('too long → invalid', () => {
    expect(isValidInviteCode('ABCDEFG')).toBe(false)
  })

  it('special characters → invalid', () => {
    expect(isValidInviteCode('ABC-EF')).toBe(false)
    expect(isValidInviteCode('ABC EF')).toBe(false)
  })
})

// ============================================================
describe('character switching rules', () => {
  it('claimed arc 1, now on arc 2 → can switch', () => {
    expect(canSwitchCharacter(1, 2)).toBe(true)
  })

  it('claimed arc 1, still on arc 1 → cannot switch', () => {
    expect(canSwitchCharacter(1, 1)).toBe(false)
  })

  it('claimed arc 5, now on arc 5 → cannot switch', () => {
    expect(canSwitchCharacter(5, 5)).toBe(false)
  })

  it('claimed arc 5, now on arc 6 → can switch', () => {
    expect(canSwitchCharacter(5, 6)).toBe(true)
  })

  it('claimed arc 1, now on arc 17 → can switch (many arcs later)', () => {
    expect(canSwitchCharacter(1, 17)).toBe(true)
  })
})

// ============================================================
describe('character unlock by arc', () => {
  it('Luffy unlocks at arc 1 → always available', () => {
    expect(isCharacterUnlocked(1, 1)).toBe(true)
  })

  it('Usopp unlocks at arc 3 → not available at arc 1', () => {
    expect(isCharacterUnlocked(3, 1)).toBe(false)
    expect(isCharacterUnlocked(3, 2)).toBe(false)
  })

  it('Usopp unlocks at arc 3 → available at arc 3+', () => {
    expect(isCharacterUnlocked(3, 3)).toBe(true)
    expect(isCharacterUnlocked(3, 10)).toBe(true)
  })

  it('Jinbe unlocks at arc 17 → not available until Wano', () => {
    expect(isCharacterUnlocked(17, 16)).toBe(false)
    expect(isCharacterUnlocked(17, 17)).toBe(true)
  })

  it('Brook unlocks at arc 11 → Thriller Bark', () => {
    expect(isCharacterUnlocked(11, 10)).toBe(false)
    expect(isCharacterUnlocked(11, 11)).toBe(true)
  })
})

// ============================================================
describe('party XP budget scaling', () => {
  it('normalises correctly across party sizes', () => {
    expect(partyXpBudget(1)).toBe(300)
    expect(partyXpBudget(2)).toBe(300)
    expect(partyXpBudget(3)).toBe(250)
    expect(partyXpBudget(4)).toBe(250)
    expect(partyXpBudget(5)).toBe(220)
    expect(partyXpBudget(6)).toBe(220)
  })

  it('larger party has lower individual budget', () => {
    expect(partyXpBudget(5)).toBeLessThan(partyXpBudget(2))
  })
})

// ============================================================
describe('image slug generation', () => {
  it('arc names → correct island image slugs', () => {
    expect(toSlug('Romance Dawn')).toBe('romance_dawn')
    expect(toSlug('Arlong Park')).toBe('arlong_park')
    expect(toSlug('Enies Lobby')).toBe('enies_lobby')
    expect(toSlug('Whole Cake Island')).toBe('whole_cake_island')
    expect(toSlug('Wano Country')).toBe('wano_country')
    expect(toSlug('Fish-Man Island')).toBe('fish_man_island')
    expect(toSlug('???')).toBe('_')
  })

  it('boss names → correct boss image slugs', () => {
    expect(toSlug('Captain Morgan')).toBe('captain_morgan')
    expect(toSlug('Rob Lucci')).toBe('rob_lucci')
    expect(toSlug('Gecko Moria')).toBe('gecko_moria')
    expect(toSlug('Admiral Akainu')).toBe('admiral_akainu')
    expect(toSlug('Donquixote Doflamingo')).toBe('donquixote_doflamingo')
  })
})
