import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Task, Completion, TaskFormData, XpResult } from '@/types'
import { calculateXp, getWeekStart, isConsecutiveDay, isToday, secondWindBonus } from '@/lib/xp'
import { usePartyStore } from '@/store/partyStore'

interface TasksState {
  tasks: Task[]
  completions: Completion[]
  loading: boolean
  error: string | null
  lastArcEvent: import('@/store/partyStore').ArcEvent | null
  lastSecondWindMessage: string | null

  fetchTasks: (userId: string) => Promise<void>
  fetchTodayCompletions: (userId: string) => Promise<void>
  createTask: (userId: string, data: TaskFormData) => Promise<Task | null>
  updateTask: (taskId: string, data: Partial<TaskFormData>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  completeTask: (params: CompleteTaskParams) => Promise<XpResult | null>
  clearArcEvent: () => void
  clearSecondWindMessage: () => void
}

interface CompleteTaskParams {
  task: Task
  userId: string
  partyId: string
  memberCount: number
  weeklyXpUsed: number
  bonusType?: string
  bonusPct?: number
  currentStreak: number
  lastActiveDate: string | null
  consecutiveMissedDays: number
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  completions: [],
  loading: false,
  error: null,
  lastArcEvent: null,
  lastSecondWindMessage: null,

  fetchTasks: async (userId) => {
    set({ loading: true, error: null })
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 4000)

      const { data, error } = await supabase
        .from('tasks').select('*').eq('user_id', userId).eq('is_active', true)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal)

      clearTimeout(timer)
      if (error) throw error
      set({ tasks: data as Task[], loading: false })
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? 'Request timed out' : (e?.message ?? 'Failed to load')
      console.error('fetchTasks error:', msg)
      set({ loading: false, error: msg })
    }
  },

  fetchTodayCompletions: async (userId) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('completions').select('*').eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)
    if (data) set({ completions: data as Completion[] })
  },

  createTask: async (userId, data) => {
    const { data: task, error } = await supabase
      .from('tasks').insert({ user_id: userId, ...data }).select().single()
    if (error || !task) { set({ error: error?.message ?? 'Failed to create task' }); return null }
    set(state => ({ tasks: [task as Task, ...state.tasks] }))
    return task as Task
  },

  updateTask: async (taskId, data) => {
    const { error } = await supabase.from('tasks').update(data).eq('id', taskId)
    if (!error) set(state => ({ tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...data } : t) }))
  },

  deleteTask: async (taskId) => {
    await supabase.from('tasks').update({ is_active: false }).eq('id', taskId)
    set(state => ({ tasks: state.tasks.filter(t => t.id !== taskId) }))
  },

  completeTask: async (params) => {
    try {
      const todayCompletions = get().completions.filter(c => c.user_id === params.userId)

    // ---- Second Wind check ----
    const windBonus = secondWindBonus(params.consecutiveMissedDays)
    const isSecondWind = windBonus.partyXpBonus > 0 && todayCompletions.length === 0

    // ---- Calculate XP ----
    const xpResult = calculateXp({
      difficulty: params.task.difficulty,
      taskType: params.task.task_type,
      tasksCompletedToday: todayCompletions.length,
      weeklyXpUsed: params.weeklyXpUsed,
      memberCount: params.memberCount,
      bonusType: params.bonusType,
      bonusPct: params.bonusPct,
      secondWindMultiplier: isSecondWind ? windBonus.personalMultiplier : undefined,
    })

    // ---- Insert completion ----
    const { data: completion, error } = await supabase
      .from('completions').insert({
        task_id: params.task.id,
        user_id: params.userId,
        party_id: params.partyId,
        xp_earned: xpResult.xpEarned,
        xp_raw: xpResult.xpRaw,
        power_earned: xpResult.powerEarned,
        bounty_earned: xpResult.bountyEarned,
        counted_for_party: xpResult.countedForParty,
      }).select().single()

    if (error || !completion) return null

    // ---- Update profile stats ----
    const wasActiveToday = isToday(params.lastActiveDate)
    const wasConsecutive = isConsecutiveDay(params.lastActiveDate)
    const newStreak = wasActiveToday ? params.currentStreak : wasConsecutive ? params.currentStreak + 1 : 1

    const { data: currentProfile } = await supabase
      .from('profiles').select('total_xp, power, bounty, longest_streak').eq('id', params.userId).single()

    if (currentProfile) {
      await supabase.from('profiles').update({
        total_xp: currentProfile.total_xp + xpResult.xpEarned,
        power:    currentProfile.power    + xpResult.powerEarned,
        bounty:   currentProfile.bounty   + xpResult.bountyEarned,
        current_streak:  newStreak,
        longest_streak:  Math.max(currentProfile.longest_streak, newStreak),
        last_active_date: new Date().toISOString().split('T')[0],
        consecutive_missed_days: 0,
      }).eq('id', params.userId)
    }

    // ---- Update weekly XP ----
    const weekStart = getWeekStart()
    const { data: existingWeekly } = await supabase
      .from('weekly_xp').select('*').eq('user_id', params.userId).eq('week_start', weekStart).maybeSingle()

    if (existingWeekly) {
      await supabase.from('weekly_xp').update({
        xp_used:     existingWeekly.xp_used     + (xpResult.countedForParty  ? xpResult.xpEarned : 0),
        xp_personal: existingWeekly.xp_personal + (!xpResult.countedForParty ? xpResult.xpEarned : 0),
        tasks_today: existingWeekly.tasks_today + 1,
      }).eq('id', existingWeekly.id)
    } else {
      await supabase.from('weekly_xp').insert({
        user_id:     params.userId,
        party_id:    params.partyId,
        week_start:  weekStart,
        xp_used:     xpResult.countedForParty  ? xpResult.xpEarned : 0,
        xp_personal: !xpResult.countedForParty ? xpResult.xpEarned : 0,
        tasks_today: 1,
      })
    }

    // ---- Update arc progress XP ----
    const partyStore = usePartyStore.getState()
    if (xpResult.countedForParty) {
      const { arcProgress } = partyStore
      if (arcProgress && ['active', 'boss_unlocked'].includes(arcProgress.status)) {
        const newProgressXp = arcProgress.progress_xp + xpResult.xpEarned
        await supabase.from('arc_progress')
          .update({ progress_xp: newProgressXp }).eq('id', arcProgress.id)
        // Optimistic local update so checkAndAdvanceArc sees the new value immediately
        usePartyStore.setState({ arcProgress: { ...arcProgress, progress_xp: newProgressXp } })
      }
    }

    // ---- Boss damage (2d) ----
    if (partyStore.arcProgress?.status === 'boss_active') {
      // Damage = difficulty tier base XP as a simple proxy for effort
      const damage = xpResult.xpRaw
      await partyStore.applyBossDamage(params.partyId, damage)
    }

    // ---- Second Wind party XP bonus ----
    if (isSecondWind && windBonus.partyXpBonus > 0) {
      const { arcProgress } = usePartyStore.getState()
      if (arcProgress && arcProgress.status === 'active') {
        const boosted = arcProgress.progress_xp + windBonus.partyXpBonus
        await supabase.from('arc_progress')
          .update({ progress_xp: boosted }).eq('id', arcProgress.id)
        usePartyStore.setState({ arcProgress: { ...arcProgress, progress_xp: boosted } })
      }
      set({ lastSecondWindMessage: windBonus.message })
    }

    // ---- Check arc advancement ----
    const { event } = await partyStore.checkAndAdvanceArc(params.partyId)
    if (event) set({ lastArcEvent: event })

    set(state => ({ completions: [...state.completions, completion as Completion] }))
    return xpResult
    } catch (e) {
      console.error('completeTask threw:', e)
      return null
    }
  },

  clearArcEvent: () => set({ lastArcEvent: null }),
  clearSecondWindMessage: () => set({ lastSecondWindMessage: null }),
}))