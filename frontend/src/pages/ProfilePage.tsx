import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, signOut } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { usePartyStore } from '@/store/partyStore'
import { Card, StatBadge, ProgressBar, Button, Spinner } from '@/components/ui'
import { TASK_TYPES } from '@/types'
import type { Character } from '@/types'
import { useNavigate } from 'react-router-dom'

interface TaskTypeStat {
  type: string; count: number; emoji: string; label: string
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, fetchProfile } = useAuthStore()
  const { members, currentArc } = usePartyStore()

  const [taskStats, setTaskStats]         = useState<TaskTypeStat[]>([])
  const [totalCompletions, setTotal]      = useState(0)
  const [arcsCompleted, setArcsCompleted] = useState(0)
  const [characters, setCharacters]       = useState<Character[]>([])
  const [takenCharIds, setTakenCharIds]   = useState<string[]>([])
  const [showCharPicker, setShowPicker]   = useState(false)
  const [switchingChar, setSwitching]     = useState(false)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const [leavingCrew, setLeavingCrew]     = useState(false)

  const currentArcNumber = currentArc?.arc_number ?? 1

  // 2c enforcement: can only switch if claimed on a PREVIOUS arc
  // i.e. character_claimed_arc < currentArcNumber
  const canSwitch = (profile?.character_claimed_arc ?? 1) < currentArcNumber
  const arcsTillSwitch = canSwitch ? 0 : 1  // always 1 arc away if blocked

  useEffect(() => {
    if (!profile?.id) return
    fetchStats()
  }, [profile?.id])

  async function fetchStats() {
    if (!profile?.id) return
    const { data: completionData } = await supabase
      .from('completions').select('task_id, tasks(task_type)').eq('user_id', profile.id)

    if (completionData) {
      setTotal(completionData.length)
      const counts: Record<string, number> = {}
      completionData.forEach((c: any) => {
        const type = c.tasks?.task_type ?? 'unknown'
        counts[type] = (counts[type] ?? 0) + 1
      })
      setTaskStats(TASK_TYPES.map(t => ({
        type: t.key, count: counts[t.key] ?? 0, emoji: t.emoji, label: t.label,
      })))
    }

    if (profile.party_id) {
      const { count } = await supabase
        .from('arc_progress').select('id', { count: 'exact' })
        .eq('party_id', profile.party_id).eq('status', 'completed')
      setArcsCompleted(count ?? 0)
    }
  }

  async function openCharPicker() {
    if (!profile?.party_id) return
    // Load available characters up to current arc
    const { data } = await supabase
      .from('characters').select('*').lte('unlock_arc', currentArcNumber).order('sort_order')
    if (data) setCharacters(data as Character[])

    // Which are taken by other members
    const taken = members
      .filter(m => m.id !== profile.id && m.character_id)
      .map(m => m.character_id!)
    setTakenCharIds(taken)
    setShowPicker(true)
  }

  async function handleSwitchCharacter(charId: string) {
    if (!profile || charId === profile.character_id) return
    setSwitching(true)
    await supabase.from('profiles').update({
      character_id: charId,
      character_claimed_arc: currentArcNumber,  // record which arc they switched on
    }).eq('id', profile.id)
    await fetchProfile(profile.id)
    setSwitching(false)
    setShowPicker(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleLeaveCrew() {
    if (!profile) return
    setLeavingCrew(true)
    try {
      await supabase.from('profiles').update({
        party_id: null,
        character_id: null,
        character_claimed_arc: 1,
        is_party_admin: false,
      }).eq('id', profile.id)
      await fetchProfile(profile.id)
      navigate('/onboarding')
    } catch (e) {
      console.error('handleLeaveCrew error:', e)
    } finally {
      setLeavingCrew(false)
      setShowLeaveWarning(false)
    }
  }

  if (!profile) return null

  const topTaskType = taskStats.reduce(
    (top, s) => s.count > (top?.count ?? -1) ? s : top, null as TaskTypeStat | null
  )
  const myCharacter = characters.find(c => c.id === profile.character_id)

  return (
    <div className="px-4 py-5 flex flex-col gap-5">

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-parchment p-5 text-center">
        <div className="text-5xl mb-2">{myCharacter?.avatar_emoji ?? '🏴‍☠️'}</div>
        <h2 className="font-display text-xl text-ink-900">{profile.username}</h2>
        {myCharacter && (
          <div className="font-heading text-xs uppercase tracking-wider text-sea-700 mt-1">
            {myCharacter.name} · {myCharacter.role}
          </div>
        )}
        <div className="font-heading text-xs uppercase tracking-wider text-ink-500 mt-1">
          {profile.current_streak > 0
            ? <span className="text-wanted-600">🔥 {profile.current_streak}-day streak</span>
            : <span>No active streak</span>}
        </div>
        {profile.longest_streak > 0 && (
          <div className="font-body text-xs text-ink-400 italic mt-1">Best: {profile.longest_streak} days</div>
        )}

        {/* Switch character button with enforcement */}
        {canSwitch ? (
          <button
            onClick={openCharPicker}
            className="mt-3 font-heading text-xs uppercase tracking-wider text-sea-600 hover:text-sea-800
                       border border-sea-300 hover:border-sea-500 rounded px-3 py-1.5 transition-colors"
          >
            Switch Character
          </button>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-1">
            <button
              onClick={openCharPicker}
              className="font-heading text-xs uppercase tracking-wider text-ink-400
                         border border-parchment-300 rounded px-3 py-1.5 cursor-not-allowed opacity-60"
              disabled
            >
              Switch Character
            </button>
            <p className="font-body text-[11px] text-ink-400 italic">
              Available next arc (Arc {currentArcNumber + arcsTillSwitch})
            </p>
          </div>
        )}
      </motion.div>

      {/* Core stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="grid grid-cols-2 gap-2">
          <StatBadge icon="⚡" label="Power Level" value={profile.power} />
          <StatBadge icon="💰" label="Bounty" value={profile.bounty.toLocaleString()} sub="B" />
          <StatBadge icon="⭐" label="Total XP" value={profile.total_xp.toLocaleString()} />
          <StatBadge icon="📜" label="Completions" value={totalCompletions} />
        </div>
      </motion.div>

      {/* Task type breakdown */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card>
          <div className="font-heading text-xs uppercase tracking-wider text-ink-500 mb-3">Mission Types</div>
          <div className="flex flex-col gap-2">
            {taskStats.map(stat => (
              <div key={stat.type} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{stat.emoji}</span>
                <span className="font-heading text-xs uppercase tracking-wide text-ink-700 w-20 shrink-0">{stat.label}</span>
                <div className="flex-1">
                  <ProgressBar value={stat.count} max={Math.max(1, Math.max(...taskStats.map(s => s.count)))} color="sea" />
                </div>
                <span className="font-mono text-xs text-ink-600 w-6 text-right">{stat.count}</span>
              </div>
            ))}
          </div>
          {topTaskType && topTaskType.count > 0 && (
            <p className="font-body text-xs text-ink-400 italic mt-3 border-t border-parchment-200 pt-3">
              Favourite: {topTaskType.emoji} {topTaskType.label} ({topTaskType.count} times)
            </p>
          )}
        </Card>
      </motion.div>

      {/* Journey progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <Card>
          <div className="font-heading text-xs uppercase tracking-wider text-ink-500 mb-3">Voyage Log</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="font-mono text-2xl font-bold text-ink-900">{arcsCompleted}</div>
              <div className="font-heading text-[10px] uppercase tracking-wide text-ink-400">Arcs Completed</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-ink-900">{profile.longest_streak}</div>
              <div className="font-heading text-[10px] uppercase tracking-wide text-ink-400">Best Streak</div>
            </div>
          </div>
          <ProgressBar value={arcsCompleted} max={17} label="Journey to the Final Island" showPct color="gold" />
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col gap-2">
        <Button variant="ghost" onClick={handleSignOut} className="w-full text-ink-400">Sign Out</Button>
        {profile.party_id && (
          <button
            onClick={() => setShowLeaveWarning(true)}
            className="w-full py-2 font-heading text-xs uppercase tracking-wider text-wanted-600
                       hover:text-wanted-700 transition-colors"
          >
            Leave Crew
          </button>
        )}
      </motion.div>
      <div className="h-4" />

      {/* ---- Leave crew confirmation modal ---- */}
      <AnimatePresence>
        {showLeaveWarning && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink-900/50 z-40 backdrop-blur-sm"
              onClick={() => setShowLeaveWarning(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-parchment-50 border-t border-parchment-300
                         rounded-t-xl p-5 pb-8 shadow-parchment-lg max-w-2xl mx-auto"
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-3">⚓</div>
                <h3 className="font-display text-lg text-ink-900 mb-2">Leave the Crew?</h3>
                <p className="font-body text-sm text-ink-600 leading-relaxed">
                  You'll lose access to this party's progress and won't be able to contribute to
                  the current arc. Your personal stats and XP are kept — but your character slot
                  will be freed for someone else.
                </p>
                <p className="font-body text-xs text-ink-400 italic mt-2">
                  You can join a new crew with an invite code afterwards.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowLeaveWarning(false)}
                >
                  Stay
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={leavingCrew}
                  onClick={handleLeaveCrew}
                >
                  Leave Crew
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---- Character picker modal ---- */}
      <AnimatePresence>
        {showCharPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink-900/40 z-40 backdrop-blur-sm"
              onClick={() => setShowPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-parchment-50 border-t border-parchment-300
                         rounded-t-xl p-5 pb-8 shadow-parchment-lg max-w-2xl mx-auto max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-base text-ink-900">Choose Your Role</h3>
                <button onClick={() => setShowPicker(false)} className="text-ink-400 hover:text-ink-700 text-xl">×</button>
              </div>

              {!canSwitch ? (
                <div className="bg-parchment-200 border border-parchment-400 rounded p-3 mb-4">
                  <p className="font-heading text-xs uppercase tracking-wide text-ink-600 mb-1">🔒 Switch Locked</p>
                  <p className="font-body text-sm text-ink-600">
                    You claimed your character during Arc {profile.character_claimed_arc}. 
                    Character switching unlocks at the start of the next arc (Arc {currentArcNumber + 1}).
                  </p>
                </div>
              ) : (
                <p className="font-body text-xs text-ink-500 italic mb-4">
                  Arc {currentArcNumber} — {characters.length} crew members available
                </p>
              )}

              {switchingChar ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {characters.map(char => {
                    const isMine  = char.id === profile.character_id
                    const isTaken = takenCharIds.includes(char.id)
                    const blocked = !canSwitch && !isMine
                    return (
                      <button
                        key={char.id}
                        onClick={() => !isTaken && canSwitch && handleSwitchCharacter(char.id)}
                        disabled={isTaken || blocked}
                        className={`relative card-parchment p-3 text-left transition-all ${
                          isMine   ? 'ring-2 ring-sea-500 bg-sea-50' :
                          isTaken || blocked ? 'opacity-40 cursor-not-allowed' :
                          'hover:shadow-parchment-lg cursor-pointer'
                        }`}
                      >
                        <div className="text-2xl mb-1">{char.avatar_emoji}</div>
                        <div className="font-heading font-semibold text-sm text-ink-900">{char.name}</div>
                        <div className="font-body text-xs text-ink-500">{char.role}</div>
                        <div className="font-body text-[10px] text-sea-700 mt-1 leading-tight">{char.class_bonus}</div>
                        {isMine && <div className="absolute top-2 right-2 text-sea-500 text-sm font-bold">✓</div>}
                        {isTaken && !isMine && (
                          <div className="absolute top-2 right-2 font-heading text-[9px] uppercase text-wanted-600 bg-wanted-50 border border-wanted-200 rounded px-1">Taken</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Locked future characters */}
              <div className="mt-4 pt-4 border-t border-parchment-200">
                <p className="font-heading text-[10px] uppercase tracking-wider text-ink-400 mb-2">Joins later</p>
                <LockedCharacters currentArc={currentArcNumber} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function LockedCharacters({ currentArc }: { currentArc: number }) {
  const [locked, setLocked] = useState<Character[]>([])
  useEffect(() => {
    supabase.from('characters').select('*').gt('unlock_arc', currentArc).order('sort_order')
      .then(({ data }) => { if (data) setLocked(data as Character[]) })
  }, [currentArc])

  if (locked.length === 0) return null
  return (
    <div className="flex gap-2 flex-wrap">
      {locked.map(char => (
        <div key={char.id} className="flex items-center gap-1.5 bg-parchment-200 border border-parchment-300 rounded px-2 py-1 opacity-60">
          <span className="text-base">{char.avatar_emoji}</span>
          <div>
            <div className="font-heading text-xs text-ink-600">{char.name}</div>
            <div className="font-heading text-[9px] uppercase text-ink-400">Arc {char.unlock_arc}</div>
          </div>
          <span className="text-ink-400 text-xs ml-1">🔒</span>
        </div>
      ))}
    </div>
  )
}