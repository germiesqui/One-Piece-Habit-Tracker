// ============================================================
// Task Repeat Logic Tests
// Tests which tasks are due on which days
// Simulates the notification edge function's pending task logic
// ============================================================
import { describe, it, expect } from 'vitest'

// ---- Replicate the notification filtering logic from edge function ----
interface Task {
  id: string
  repeat_type: 'none' | 'daily' | 'weekly' | 'custom'
  repeat_days: number[] // 0=Sun,1=Mon,...,6=Sat
}

function isPendingToday(
  task: Task,
  completedIds: Set<string>,
  dayOfWeek: number, // 0-6
  isSaturday: boolean,
): boolean {
  if (completedIds.has(task.id)) return false
  if (task.repeat_type === 'daily')  return true
  if (task.repeat_type === 'none')   return false
  if (task.repeat_type === 'weekly' && isSaturday) return true
  if (task.repeat_type === 'custom') return task.repeat_days.includes(dayOfWeek)
  return false
}

// ============================================================
describe('task repeat logic', () => {
  const daily:   Task = { id: 'daily-1',   repeat_type: 'daily',  repeat_days: [] }
  const weekly:  Task = { id: 'weekly-1',  repeat_type: 'weekly', repeat_days: [] }
  const oneOff:  Task = { id: 'once-1',    repeat_type: 'none',   repeat_days: [] }
  const custom:  Task = { id: 'custom-1',  repeat_type: 'custom', repeat_days: [1, 3, 5] } // Mon, Wed, Fri
  const empty    = new Set<string>()

  // ---- Daily tasks ----
  it('daily task shows every day', () => {
    [0,1,2,3,4,5,6].forEach(day => {
      expect(isPendingToday(daily, empty, day, day === 6)).toBe(true)
    })
  })

  it('completed daily task is not pending', () => {
    const done = new Set(['daily-1'])
    expect(isPendingToday(daily, done, 1, false)).toBe(false)
  })

  // ---- Weekly tasks ----
  it('weekly task shows only on Saturday', () => {
    expect(isPendingToday(weekly, empty, 6, true)).toBe(true)
  })

  it('weekly task does not show on weekdays', () => {
    [0,1,2,3,4].forEach(day => {
      expect(isPendingToday(weekly, empty, day, false)).toBe(false)
    })
  })

  it('completed weekly task is not pending on Saturday', () => {
    const done = new Set(['weekly-1'])
    expect(isPendingToday(weekly, done, 6, true)).toBe(false)
  })

  // ---- One-off tasks ----
  it('one-off task never shows as pending (no nagging)', () => {
    [0,1,2,3,4,5,6].forEach(day => {
      expect(isPendingToday(oneOff, empty, day, day === 6)).toBe(false)
    })
  })

  // ---- Custom tasks (Mon=1, Wed=3, Fri=5) ----
  it('custom task shows on configured days', () => {
    expect(isPendingToday(custom, empty, 1, false)).toBe(true)  // Monday
    expect(isPendingToday(custom, empty, 3, false)).toBe(true)  // Wednesday
    expect(isPendingToday(custom, empty, 5, false)).toBe(true)  // Friday
  })

  it('custom task does not show on non-configured days', () => {
    expect(isPendingToday(custom, empty, 0, false)).toBe(false) // Sunday
    expect(isPendingToday(custom, empty, 2, false)).toBe(false) // Tuesday
    expect(isPendingToday(custom, empty, 4, false)).toBe(false) // Thursday
    expect(isPendingToday(custom, empty, 6, true)).toBe(false)  // Saturday
  })

  it('completed custom task is not pending', () => {
    const done = new Set(['custom-1'])
    expect(isPendingToday(custom, done, 1, false)).toBe(false)
  })

  // ---- Multiple tasks ----
  it('correctly identifies pending from a mixed list', () => {
    const tasks = [daily, weekly, oneOff, custom]
    const done  = new Set(['daily-1'])
    const pending = tasks.filter(t => isPendingToday(t, done, 1, false)) // Monday
    // weekly(no), oneOff(no), custom(yes Mon), daily(completed)
    expect(pending.map(t => t.id)).toEqual(['custom-1'])
  })

  it('Saturday: daily + weekly both pending', () => {
    const tasks = [daily, weekly, oneOff, custom]
    const pending = tasks.filter(t => isPendingToday(t, empty, 6, true))
    expect(pending.map(t => t.id).sort()).toEqual(['daily-1', 'weekly-1'].sort())
  })
})

// ============================================================
// Task completion uniqueness — can't complete twice today
// ============================================================
describe('task completion uniqueness', () => {
  it('task already in completedIds is not pending', () => {
    const task: Task = { id: 'task-abc', repeat_type: 'daily', repeat_days: [] }
    const done = new Set(['task-abc'])
    expect(isPendingToday(task, done, 1, false)).toBe(false)
  })

  it('different task id is still pending', () => {
    const task: Task = { id: 'task-xyz', repeat_type: 'daily', repeat_days: [] }
    const done = new Set(['task-abc'])
    expect(isPendingToday(task, done, 1, false)).toBe(true)
  })
})