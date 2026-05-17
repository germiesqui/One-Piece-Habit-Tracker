import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Party, PartyMember, Arc, ArcProgress, WeeklyXp } from '@/types'
import { weeklyBudget, getWeekStart } from '@/lib/xp'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PartyState {
  party: Party | null
  members: PartyMember[]
  currentArc: Arc | null
  arcProgress: ArcProgress | null
  weeklyXp: WeeklyXp[]
  loading: boolean
  error: string | null
  realtimeChannel: RealtimeChannel | null

  fetchParty: (partyId: string) => Promise<void>
  fetchMembers: (partyId: string) => Promise<void>
  fetchArcData: (partyId: string) => Promise<void>
  fetchWeeklyXp: (partyId: string) => Promise<void>
  createParty: (name: string, userId: string) => Promise<Party | null>
  joinParty: (inviteCode: string, userId: string) => Promise<Party | null>
  subscribeToParty: (partyId: string) => void
  unsubscribeFromParty: () => void
  checkAndAdvanceArc: (partyId: string) => Promise<{ event: ArcEvent | null }>
  applyBossDamage: (partyId: string, damage: number) => Promise<void>
  weeklyBudgetForParty: () => number
  currentUserWeeklyXp: (userId: string) => WeeklyXp | null
}

export type ArcEvent =
  | { type: 'boss_unlocked'; arcName: string; bossName: string }
  | { type: 'boss_defeated'; arcName: string }
  | { type: 'arc_complete'; nextArcName: string }
  | { type: 'journey_complete' }

export const usePartyStore = create<PartyState>((set, get) => ({
  party: null,
  members: [],
  currentArc: null,
  arcProgress: null,
  weeklyXp: [],
  loading: false,
  error: null,
  realtimeChannel: null,

  fetchParty: async (partyId) => {
    const { data } = await supabase.from('parties').select('*').eq('id', partyId).single()
    if (data) set({ party: data as Party })
  },

  fetchMembers: async (partyId) => {
    const { data } = await supabase.from('party_members').select('*').eq('party_id', partyId)
    if (data) set({ members: data as PartyMember[] })
  },

  fetchArcData: async (partyId) => {
    const { data: progressData } = await supabase
      .from('arc_progress')
      .select('*')
      .eq('party_id', partyId)
      .in('status', ['active', 'boss_unlocked', 'boss_active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (progressData) {
      set({ arcProgress: progressData as ArcProgress })
      const { data: arcData } = await supabase
        .from('arcs').select('*').eq('id', progressData.arc_id).single()
      if (arcData) set({ currentArc: arcData as Arc })
    } else {
      set({ arcProgress: null, currentArc: null })
    }
  },

  fetchWeeklyXp: async (partyId) => {
    const weekStart = getWeekStart()
    const { data } = await supabase
      .from('weekly_xp').select('*').eq('party_id', partyId).eq('week_start', weekStart)
    if (data) set({ weeklyXp: data as WeeklyXp[] })
  },

  // ---- 2b: Realtime subscriptions ----
  subscribeToParty: (partyId) => {
    get().unsubscribeFromParty()

    const channel = supabase
      .channel(`party:${partyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'completions',
        filter: `party_id=eq.${partyId}`,
      }, () => {
        get().fetchWeeklyXp(partyId)
        get().fetchArcData(partyId)
        get().fetchMembers(partyId)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'arc_progress',
        filter: `party_id=eq.${partyId}`,
      }, () => {
        get().fetchArcData(partyId)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, () => {
        get().fetchMembers(partyId)
      })
      .subscribe()

    set({ realtimeChannel: channel })
  },

  unsubscribeFromParty: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      set({ realtimeChannel: null })
    }
  },

  // ---- 2a: Arc advancement logic ----
  checkAndAdvanceArc: async (partyId) => {
    const { arcProgress, currentArc, members } = get()
    if (!arcProgress || !currentArc) return { event: null }

    // BOSS ACTIVE: check if defeated
    if (arcProgress.status === 'boss_active') {
      if ((arcProgress.boss_current_hp ?? 0) <= 0) {

        // Check Bounty threshold before allowing arc completion
        const avgBounty = members.reduce((s, m) => s + m.bounty, 0) / Math.max(members.length, 1)
        const bountyMet = avgBounty >= currentArc.bounty_required

        if (!bountyMet) {
          // Boss defeated but not enough Bounty to leave the island yet
          // Keep boss_active at 0 HP — show a different message in UI
          return { event: null }
        }

        await supabase.from('arc_progress').update({
          status: 'completed',
          boss_ended_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }).eq('id', arcProgress.id)

        const { data: nextArc } = await supabase
          .from('arcs').select('*')
          .eq('arc_number', currentArc.arc_number + 1)
          .eq('hidden', false)
          .maybeSingle()

        if (nextArc) {
          await supabase.from('arc_progress').insert({
            party_id: partyId, arc_id: nextArc.id, status: 'active', progress_xp: 0,
          })
          await supabase.from('parties').update({ current_arc_id: nextArc.id }).eq('id', partyId)
          await get().fetchArcData(partyId)
          return { event: { type: 'arc_complete', nextArcName: nextArc.name } }
        }
        await get().fetchArcData(partyId)
        return { event: { type: 'journey_complete' } }
      }
      return { event: null }
    }

    // ACTIVE: check if arc bar full → try boss unlock (Power only)
    if (arcProgress.status === 'active') {
      const arcFull = arcProgress.progress_xp >= currentArc.xp_required
      if (!arcFull) return { event: null }

      const avgPower = members.reduce((s, m) => s + m.power, 0) / Math.max(members.length, 1)
      const powerMet = avgPower >= currentArc.power_required

      if (!powerMet) return { event: null } // bar full, not strong enough to fight boss yet

      // No boss arc (transition) — check both stats before skipping to next
      if (!currentArc.boss_name) {
        const avgBounty = members.reduce((s, m) => s + m.bounty, 0) / Math.max(members.length, 1)
        if (avgBounty < currentArc.bounty_required) return { event: null }

        await supabase.from('arc_progress').update({
          status: 'completed', completed_at: new Date().toISOString(),
        }).eq('id', arcProgress.id)

        const { data: nextArc } = await supabase
          .from('arcs').select('*').eq('arc_number', currentArc.arc_number + 1).eq('hidden', false).maybeSingle()

        if (nextArc) {
          await supabase.from('arc_progress').insert({
            party_id: partyId, arc_id: nextArc.id, status: 'active', progress_xp: 0,
          })
          await supabase.from('parties').update({ current_arc_id: nextArc.id }).eq('id', partyId)
          await get().fetchArcData(partyId)
          return { event: { type: 'arc_complete', nextArcName: nextArc.name } }
        }
        return { event: null }
      }

      // Unlock boss — Power threshold met, bar is full
      const bossHp = currentArc.boss_hp_base * Math.max(members.length, 1)
      await supabase.from('arc_progress').update({
        status: 'boss_active',
        boss_current_hp: bossHp,
        boss_started_at: new Date().toISOString(),
      }).eq('id', arcProgress.id)

      await get().fetchArcData(partyId)
      return { event: { type: 'boss_unlocked', arcName: currentArc.name, bossName: currentArc.boss_name } }
    }

    return { event: null }
  },

  // ---- 2d: Boss damage ----
  applyBossDamage: async (partyId, damage) => {
    const { arcProgress } = get()
    if (!arcProgress || arcProgress.status !== 'boss_active') return

    const newHp = Math.max(0, (arcProgress.boss_current_hp ?? 0) - damage)
    await supabase.from('arc_progress').update({ boss_current_hp: newHp }).eq('id', arcProgress.id)
    set({ arcProgress: { ...arcProgress, boss_current_hp: newHp } })
    if (newHp === 0) await get().checkAndAdvanceArc(partyId)
  },

  createParty: async (name, userId) => {
    set({ loading: true, error: null })
    const { data: party, error: partyError } = await supabase
      .from('parties').insert({ name, created_by: userId }).select().single()

    if (partyError || !party) {
      set({ loading: false, error: partyError?.message ?? 'Failed to create party' })
      return null
    }

    await supabase.from('profiles').update({ party_id: party.id, is_party_admin: true }).eq('id', userId)
    const { data: arc1 } = await supabase.from('arcs').select('id').eq('arc_number', 1).single()
    if (arc1) {
      await supabase.from('arc_progress').insert({ party_id: party.id, arc_id: arc1.id, status: 'active', progress_xp: 0 })
      await supabase.from('parties').update({ current_arc_id: arc1.id }).eq('id', party.id)
    }

    set({ party: party as Party, loading: false })
    return party as Party
  },

  joinParty: async (inviteCode, userId) => {
    set({ loading: true, error: null })
    const { data: party, error } = await supabase
      .from('parties').select('*').eq('invite_code', inviteCode.toUpperCase()).single()

    if (error || !party) {
      set({ loading: false, error: 'Invalid invite code. Check the code and try again.' })
      return null
    }

    await supabase.from('profiles').update({ party_id: party.id }).eq('id', userId)
    set({ party: party as Party, loading: false })
    return party as Party
  },

  weeklyBudgetForParty: () => weeklyBudget(get().members.length || 2),
  currentUserWeeklyXp: (userId) => get().weeklyXp.find(w => w.user_id === userId) ?? null,
}))