import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { usePartyStore } from '@/store/partyStore'
import { useTasksStore } from '@/store/tasksStore'
import { ProgressBar, StatBadge, Card, MemberCardSkeleton, ArcBannerSkeleton } from '@/components/ui'
import { VoyageHeader } from '@/components/map/VoyageHeader'
import { NotificationBanner } from '@/components/dashboard/NotificationBanner'
import { weeklyBudget } from '@/lib/xp'
import type { ArcEvent } from '@/store/partyStore'

export function DashboardPage() {
  const { profile } = useAuthStore()
  const {
    party, members, currentArc, arcProgress, weeklyXp,
    fetchParty, fetchMembers, fetchArcData, fetchWeeklyXp,
    subscribeToParty, unsubscribeFromParty,
  } = usePartyStore()
  const { lastArcEvent, lastSecondWindMessage, clearArcEvent, clearSecondWindMessage } = useTasksStore()

  const [toastEvent, setToastEvent]             = useState<ArcEvent | null>(null)
  const [windToast, setWindToast]               = useState<string | null>(null)
  const [completedArcNums, setCompletedArcNums] = useState<number[]>([])
  const [hiddenArcNums, setHiddenArcNums]       = useState<number[]>([])

  useEffect(() => {
    if (!profile?.party_id) return
    const pid = profile.party_id
    fetchParty(pid)
    fetchMembers(pid)
    fetchArcData(pid)
    fetchWeeklyXp(pid)
    subscribeToParty(pid)
    fetchMapData(pid)
    return () => unsubscribeFromParty()
  }, [profile?.party_id])

  async function fetchMapData(partyId: string) {
    // Completed arc numbers for this party
    const { data: completed } = await supabase
      .from('arc_progress')
      .select('arc_id, arcs(arc_number)')
      .eq('party_id', partyId)
      .eq('status', 'completed')
    if (completed) {
      setCompletedArcNums(completed.map((r: any) => r.arcs?.arc_number).filter(Boolean))
    }

    // Hidden arc numbers
    const { data: hidden } = await supabase
      .from('arcs')
      .select('arc_number')
      .eq('hidden', true)
    if (hidden) {
      setHiddenArcNums(hidden.map((r: any) => r.arc_number))
    }
  }

  // Show arc event toast
  useEffect(() => {
    if (!lastArcEvent) return
    setToastEvent(lastArcEvent)
    clearArcEvent()
    const t = setTimeout(() => setToastEvent(null), 6000)
    return () => clearTimeout(t)
  }, [lastArcEvent])

  // Show second wind toast
  useEffect(() => {
    if (!lastSecondWindMessage) return
    setWindToast(lastSecondWindMessage)
    clearSecondWindMessage()
    const t = setTimeout(() => setWindToast(null), 5000)
    return () => clearTimeout(t)
  }, [lastSecondWindMessage])

  if (!profile?.party_id) return <NoParty />

  // Show skeletons while party data loads
  const partyLoading = !currentArc && !arcProgress && members.length === 0

  const budget = weeklyBudget(members.length)
  const myWeeklyXp = weeklyXp.find(w => w.user_id === profile.id)
  const arcPct = currentArc && arcProgress
    ? Math.min(100, Math.round((arcProgress.progress_xp / currentArc.xp_required) * 100))
    : 0

  // Stat gate check — are we full but blocked by stats?
  const arcFull = arcProgress && currentArc
    ? arcProgress.progress_xp >= currentArc.xp_required
    : false
  const avgPower  = members.length ? members.reduce((s, m) => s + m.power,  0) / members.length : 0
  const avgBounty = members.length ? members.reduce((s, m) => s + m.bounty, 0) / members.length : 0
  const powerNeeded  = currentArc ? Math.max(0, currentArc.power_required  - avgPower)  : 0
  const bountyNeeded = currentArc ? Math.max(0, currentArc.bounty_required - avgBounty) : 0
  const statGateBlocking = arcFull && arcProgress?.status === 'active' && (powerNeeded > 0 || bountyNeeded > 0)

  // Boss fight data
  const isBossActive = arcProgress?.status === 'boss_active'
  const bossHpMax = currentArc ? currentArc.boss_hp_base * Math.max(members.length, 1) : 0
  const bossHpCurrent = arcProgress?.boss_current_hp ?? 0
  const bossHpPct = bossHpMax > 0 ? Math.round((bossHpCurrent / bossHpMax) * 100) : 0

  return (
    <div className="flex flex-col gap-0">

      {/* ---- Voyage Header ---- */}
      {partyLoading ? (
        <ArcBannerSkeleton />
      ) : (
        <VoyageHeader
          currentArc={currentArc}
          arcProgress={arcProgress}
          bossHpMax={bossHpMax}
        />
      )}

      {/* ---- Notification banner ---- */}
      {profile?.id && (
        <NotificationBanner userId={profile.id} partyId={profile.party_id} />
      )}

      {/* ---- Stat gate warning ---- */}
      <AnimatePresence>
        {statGateBlocking && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mt-3 bg-parchment-200 border border-parchment-400 rounded px-3 py-2"
          >
            <p className="font-heading text-xs uppercase tracking-wide text-ink-700">
              ⚠️ Arc complete — stats needed to proceed
            </p>
            <div className="flex gap-4 mt-1">
              {powerNeeded > 0 && (
                <p className="font-body text-xs text-ink-600">⚡ Need +{Math.ceil(powerNeeded)} avg Power</p>
              )}
              {bountyNeeded > 0 && (
                <p className="font-body text-xs text-ink-600">💰 Need +{Math.ceil(bountyNeeded)} avg Bounty</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-5 flex flex-col gap-5">

        {/* Your stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="section-header text-xs mb-3">Your Log</div>
          <div className="grid grid-cols-2 gap-2">
            <StatBadge icon="⚡" label="Power"   value={profile.power} />
            <StatBadge icon="💰" label="Bounty"  value={profile.bounty.toLocaleString()} sub="B" />
            <StatBadge icon="🔥" label="Streak"  value={profile.current_streak} sub="days" />
            <StatBadge icon="⭐" label="Total XP" value={profile.total_xp.toLocaleString()} />
          </div>
        </motion.div>

        {/* Weekly budget */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading text-xs uppercase tracking-wider text-ink-600">This Week</span>
              <span className="font-mono text-xs text-ink-500">{myWeeklyXp?.xp_used ?? 0} / {budget} XP</span>
            </div>
            <ProgressBar value={myWeeklyXp?.xp_used ?? 0} max={budget} color="sea" showPct />
            {myWeeklyXp && myWeeklyXp.xp_personal > 0 && (
              <p className="font-body text-xs text-ink-500 mt-2 italic">
                +{myWeeklyXp.xp_personal} XP in personal reserve (overflow)
              </p>
            )}
          </Card>
        </motion.div>

        {/* Crew this week */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="section-header text-xs mb-3">Crew — This Week</div>
          <div className="flex flex-col gap-2">
            {partyLoading
              ? [...Array(2)].map((_, i) => <MemberCardSkeleton key={i} />)
              : members.map(member => {
              const mxp = weeklyXp.find(w => w.user_id === member.id)
              const pct = Math.min(100, Math.round(((mxp?.xp_used ?? 0) / budget) * 100))
              const isMe = member.id === profile.id
              return (
                <Card key={member.id} className={isMe ? 'ring-1 ring-sea-400' : ''}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-9 h-9 flex items-center justify-center bg-parchment-100 border border-parchment-300 rounded">
                      {member.avatar_emoji ?? '🏴‍☠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading text-sm text-ink-900 font-semibold truncate">{member.username}</span>
                        {isMe && (
                          <span className="font-heading text-[9px] uppercase tracking-wider text-sea-600 bg-sea-50 border border-sea-200 rounded px-1">You</span>
                        )}
                      </div>
                      <div className="font-body text-xs text-ink-500">
                        {member.character_name ?? 'No character'} · {member.character_role ?? '—'}
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} max={100} color="sea" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs text-ink-900 font-bold">{mxp?.xp_used ?? 0}</div>
                      <div className="font-heading text-[9px] uppercase text-ink-400">xp</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Party invite card */}
        {party && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-heading text-xs uppercase tracking-wider text-ink-500 mb-0.5">Crew</div>
                  <div className="font-heading font-bold text-ink-900">{party.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-xs uppercase tracking-wider text-ink-500 mb-0.5">Invite Code</div>
                  <div className="font-mono text-lg font-bold text-sea-700 tracking-widest">{party.invite_code}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

      </div>

      {/* ---- Arc Event Toast ---- */}
      <AnimatePresence>
        {toastEvent && <ArcEventToast event={toastEvent} onDismiss={() => setToastEvent(null)} />}
      </AnimatePresence>

      {/* ---- Second Wind Toast ---- */}
      <AnimatePresence>
        {windToast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50
                       bg-sea-700 text-white rounded-lg px-4 py-3 shadow-parchment-lg
                       flex items-center gap-3"
            onClick={() => setWindToast(null)}
          >
            <span className="text-2xl">💨</span>
            <div>
              <p className="font-heading text-xs uppercase tracking-wide text-sea-200">Second Wind!</p>
              <p className="font-body text-sm">{windToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---- Arc Event Toast ----
function ArcEventToast({ event, onDismiss }: { event: ArcEvent; onDismiss: () => void }) {
  const config = {
    boss_unlocked:   { bg: 'bg-wanted-800',  icon: '⚔️',  title: 'Boss Unlocked!',      color: 'text-wanted-200' },
    boss_defeated:   { bg: 'bg-sea-800',     icon: '🏆',  title: 'Boss Defeated!',       color: 'text-sea-200'   },
    arc_complete:    { bg: 'bg-sea-800',     icon: '⚓',  title: 'Arc Complete!',         color: 'text-sea-200'   },
    journey_complete:{ bg: 'bg-parchment-800',icon: '🏴‍☠️', title: 'The Dream Achieved!', color: 'text-parchment-200' },
  }[event.type]

  const body =
    event.type === 'boss_unlocked'   ? `${event.bossName} awaits. Complete tasks daily to fight!` :
    event.type === 'arc_complete'    ? `Setting sail for ${event.nextArcName}!` :
    event.type === 'journey_complete'? 'The crew reached the Final Island. The dream is real.' :
    ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
      className={`fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50
                  ${config.bg} text-white rounded-lg px-4 py-4 shadow-parchment-lg`}
      onClick={onDismiss}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{config.icon}</span>
        <div>
          <p className={`font-heading text-xs uppercase tracking-wider ${config.color} mb-0.5`}>{config.title}</p>
          <p className="font-body text-sm leading-snug">{body}</p>
          <p className="font-heading text-[10px] uppercase tracking-wide text-white/50 mt-2">Tap to dismiss</p>
        </div>
      </div>
    </motion.div>
  )
}

function NoParty() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
      <div className="text-5xl">⚓</div>
      <h2 className="font-display text-xl text-ink-900">No Crew Yet</h2>
      <p className="font-body text-ink-500 text-sm max-w-xs">
        You haven't joined a crew. Head to onboarding to create or join a party.
      </p>
    </div>
  )
}

// ---- Boss image resolver ----
// Maps boss_name (from DB) to the image file in /public/bosses/
const BOSS_IMAGES: Record<string, string> = {
  'Captain Morgan': '/bosses/morgan.webp',
  'Buggy':          '/bosses/buggy.png',
  'Captain Kuro':   '/bosses/kuro.png',
  'Don Krieg':      '/bosses/krieg.webp',
  'Arlong':         '/bosses/arlong.png',
  'Wapol':          '/bosses/wapol.png',
  'Crocodile':      '/bosses/crocodile.png',
  'Enel':           '/bosses/enel.png',
  'Rob Lucci':      '/bosses/lucci.png',
  'Gecko Moria':    '/bosses/moria.png',
  'Admiral Akainu': '/bosses/akainu.png',
  'Hody Jones':     '/bosses/hody_jones.png',
  'Donquixote Doflamingo': '/bosses/doflamingo.png',
  // big_mom and kaido images not yet available — fallback shown
}

function BossBattleCard({
  bossName,
  bossHpCurrent,
  bossHpPct,
}: {
  bossName: string
  bossHpCurrent: number
  bossHpPct: number
}) {
  const imgSrc = BOSS_IMAGES[bossName] ?? null

  return (
    <div className="rounded-lg overflow-hidden border border-wanted-700 shadow-parchment-lg">
      {/* Boss image area */}
      <div className="relative h-44 bg-sea-950 flex items-center justify-center">
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={bossName}
              className="h-full w-full object-cover object-top opacity-90"
              style={{ filter: 'contrast(1.05) brightness(0.92)' }}
            />
            {/* Dark gradient overlay so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-sea-950 via-sea-950/30 to-transparent" />
          </>
        ) : (
          /* Fallback when image not yet available */
          <div className="flex flex-col items-center gap-2 opacity-40">
            <span className="text-5xl">⚔️</span>
            <p className="font-heading text-xs uppercase tracking-wider text-sea-300">
              Image coming soon
            </p>
          </div>
        )}

        {/* Boss name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
          <p className="font-heading text-[10px] uppercase tracking-widest text-wanted-300 mb-0.5">
            ⚔️ Boss Fight
          </p>
          <p className="font-display text-lg text-white leading-tight drop-shadow-lg">
            {bossName}
          </p>
        </div>

        {/* HP counter top-right */}
        <div className="absolute top-2 right-3 text-right">
          <p className="font-mono text-2xl font-bold text-white drop-shadow-lg leading-none">
            {bossHpCurrent.toLocaleString()}
          </p>
          <p className="font-heading text-[9px] uppercase tracking-wide text-wanted-300">
            HP remaining
          </p>
        </div>
      </div>

      {/* HP bar */}
      <div className="bg-sea-950 px-3 pb-3 pt-2">
        <div className="h-4 bg-sea-900 rounded border border-wanted-800 overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-wanted-700 to-wanted-400"
            initial={{ width: `${bossHpPct}%` }}
            animate={{ width: `${bossHpPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          {/* Segmented tick marks every 25% */}
          {[25, 50, 75].map(tick => (
            <div
              key={tick}
              className="absolute top-0 bottom-0 w-px bg-sea-800"
              style={{ left: `${tick}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-[10px] uppercase tracking-wider text-white drop-shadow">
              {bossHpPct}% HP
            </span>
          </div>
        </div>
        <p className="font-body text-xs text-sea-400 italic mt-1.5">
          Complete tasks daily to deal damage. Missing a day lets the boss recover.
        </p>
      </div>
    </div>
  )
}