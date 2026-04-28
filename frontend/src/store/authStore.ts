import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import { calcMissedDays } from '@/lib/xp'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  checkAndUpdateMissedDays: (profile: Profile) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),

  // ---- 4a: Calculate and persist missed days ----
  checkAndUpdateMissedDays: async (profile: Profile) => {
    const missed = calcMissedDays(profile.last_active_date)

    // Only write to DB if the value has changed
    if (missed === profile.consecutive_missed_days) return

    // If they were active today already, don't touch anything
    const today = new Date().toISOString().split('T')[0]
    if (profile.last_active_date === today) return

    // Reset streak if they missed 2+ days (missed yesterday = streak broken)
    const streakBroken = missed >= 1
    const updates: Partial<Profile> = {
      consecutive_missed_days: missed,
      ...(streakBroken ? { current_streak: 0 } : {}),
    }

    await supabase.from('profiles').update(updates).eq('id', profile.id)

    // Update local state immediately so Second Wind triggers correctly
    set({ profile: { ...profile, ...updates } })
  },

  fetchProfile: async (userId: string) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, attempt === 0 ? 300 : 800))

      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle()

      if (error) { console.warn(`fetchProfile attempt ${attempt + 1}:`, error.message); continue }
      if (data) {
        const profile = data as Profile
        set({ profile })
        // Run missed-day check every time profile loads
        await get().checkAndUpdateMissedDays(profile)
        return
      }
    }
    console.error('fetchProfile: could not load after 5 attempts')
  },

  initialize: async () => {
    set({ loading: true })

    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })

    if (session?.user) {
      await get().fetchProfile(session.user.id)
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })

    // 4a: Re-check missed days when tab becomes visible again
    // Handles the case where the app was left open overnight
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return
      const { profile } = get()
      if (profile) await get().checkAndUpdateMissedDays(profile)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    set({ loading: false, initialized: true })
  },
}))