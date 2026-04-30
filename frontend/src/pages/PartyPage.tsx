import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { usePartyStore } from '@/store/partyStore'
import { Card, ProgressBar, MemberCardSkeleton } from '@/components/ui'
import { weeklyBudget } from '@/lib/xp'

export function PartyPage() {
  const { profile } = useAuthStore()
  const { party, members, weeklyXp, fetchParty, fetchMembers, fetchArcData, fetchWeeklyXp } = usePartyStore()

  useEffect(() => {
    if (!profile?.party_id) return
    fetchParty(profile.party_id)
    fetchMembers(profile.party_id)
    fetchArcData(profile.party_id)
    fetchWeeklyXp(profile.party_id)
  }, [profile?.party_id])

  const budget = weeklyBudget(members.length)
  const totalPartyXpThisWeek = weeklyXp.reduce((sum, w) => sum + w.xp_used, 0)
  const avgPartyXp = members.length ? Math.round(totalPartyXpThisWeek / members.length) : 0

  function copyInviteCode() {
    if (!party?.invite_code) return
    navigator.clipboard.writeText(party.invite_code)
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg text-ink-900">The Crew</h2>
        {party && (
          <p className="font-body text-sm text-ink-500 italic">{party.name}</p>
        )}
      </div>

      {/* Party invite code */}
      {party && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-heading text-xs uppercase tracking-wider text-ink-500 mb-1">Invite Code</div>
              <div className="font-mono text-2xl font-bold text-sea-700 tracking-[0.3em]">
                {party.invite_code}
              </div>
              <p className="font-body text-xs text-ink-400 mt-1">Share this with your crew</p>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex flex-col items-center gap-1 text-ink-500 hover:text-ink-800 transition-colors px-3 py-2"
            >
              <span className="text-xl">📋</span>
              <span className="font-heading text-[10px] uppercase tracking-wide">Copy</span>
            </button>
          </div>
        </Card>
      )}

      {/* Party weekly summary */}
      <Card>
        <div className="section-header text-xs mb-3">Party — This Week</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ink-900">{totalPartyXpThisWeek}</div>
            <div className="font-heading text-[10px] uppercase tracking-wide text-ink-500">Total XP</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ink-900">{avgPartyXp}</div>
            <div className="font-heading text-[10px] uppercase tracking-wide text-ink-500">Avg / Member</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ink-900">{members.length}</div>
            <div className="font-heading text-[10px] uppercase tracking-wide text-ink-500">Crew Size</div>
          </div>
        </div>
      </Card>

      {/* Crew roster */}
      <div>
        <div className="section-header text-xs mb-3">Roster</div>
        <div className="flex flex-col gap-3">
          {members.length === 0
            ? [...Array(2)].map((_, i) => <MemberCardSkeleton key={i} />)
            : members.map((member, i) => {
            const mxp = weeklyXp.find(w => w.user_id === member.id)
            const isMe = member.id === profile?.id

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={isMe ? 'ring-1 ring-sea-400' : ''}>
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl w-11 h-11 flex items-center justify-center bg-parchment-100 border border-parchment-300 rounded">
                      {member.avatar_emoji ?? '🏴‍☠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-bold text-ink-900">{member.username}</span>
                        {isMe && (
                          <span className="font-heading text-[9px] uppercase tracking-wider text-sea-600 bg-sea-50 border border-sea-200 rounded px-1">
                            You
                          </span>
                        )}
                        {member.is_party_admin && (
                          <span className="font-heading text-[9px] uppercase tracking-wider text-parchment-700 bg-parchment-200 border border-parchment-300 rounded px-1">
                            Captain
                          </span>
                        )}
                      </div>
                      <div className="font-body text-xs text-ink-500">
                        {member.character_name ?? 'No character'} · {member.character_role ?? '—'}
                      </div>
                      {member.bonus_type && (
                        <div className="font-body text-[11px] text-sea-700 mt-0.5">
                          +{member.bonus_pct}% on {member.bonus_type} tasks
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center">
                      <div className="font-mono text-sm font-bold text-ink-900">{member.power}</div>
                      <div className="font-heading text-[9px] uppercase text-ink-400">⚡ Power</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-sm font-bold text-ink-900">{member.bounty}</div>
                      <div className="font-heading text-[9px] uppercase text-ink-400">💰 Bounty</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-sm font-bold text-ink-900">{member.current_streak}</div>
                      <div className="font-heading text-[9px] uppercase text-ink-400">🔥 Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-sm font-bold text-ink-900">{member.total_xp}</div>
                      <div className="font-heading text-[9px] uppercase text-ink-400">⭐ XP</div>
                    </div>
                  </div>

                  {/* Weekly budget bar */}
                  <ProgressBar
                    value={mxp?.xp_used ?? 0}
                    max={budget}
                    label="Weekly Budget"
                    showPct
                    color="sea"
                  />
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}