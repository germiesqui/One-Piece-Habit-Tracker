import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
 
interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  initialize: () => Promise<void>
}
 
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,
 
  setSession: (session) => {
    set({ session, user: session?.user ?? null })
  },
 
  setProfile: (profile) => {
    set({ profile })
  },
 
  fetchProfile: async (userId: string) => {
    // Retry up to 5 times — profile row is created by a DB trigger
    // and may not be immediately available after signup
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, attempt === 0 ? 300 : 800))
 
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
 
      if (error) {
        console.warn(`fetchProfile attempt ${attempt + 1} error:`, error.message)
        continue
      }
      if (data) {
        set({ profile: data as Profile })
        return
      }
    }
    console.error('fetchProfile: could not load profile after 5 attempts')
  },
 
  initialize: async () => {
    set({ loading: true })
 
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })
 
    if (session?.user) {
      await get().fetchProfile(session.user.id)
    }
 
    // Listen for auth changes — ignore INITIAL_SESSION, handled above
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
 
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
 
    set({ loading: false, initialized: true })
  },
}))