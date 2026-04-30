import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { usePartyStore } from '@/store/partyStore'
import { Button, Input } from '@/components/ui'
import type { Character } from '@/types'

type Step = 'party' | 'character'
type PartyMode = 'create' | 'join'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, fetchProfile } = useAuthStore()
  const { createParty, joinParty, loading, error } = usePartyStore()

  const [step, setStep] = useState<Step>('party')
  const [mode, setMode] = useState<PartyMode>('create')
  const [partyName, setPartyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [takenCharIds, setTakenCharIds] = useState<string[]>([])
  const [localError, setLocalError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load available characters (arc 1 only for start)
    supabase
      .from('characters')
      .select('*')
      .lte('unlock_arc', 1)
      .order('sort_order')
      .then(({ data }) => { if (data) setCharacters(data as Character[]) })
  }, [])

  async function handlePartyStep(e: React.FormEvent) {
    e.preventDefault()
    setLocalError('')
    if (!user) return

    let party = null
    if (mode === 'create') {
      if (!partyName.trim()) { setLocalError('Give your crew a name.'); return }
      party = await createParty(partyName.trim(), user.id)
    } else {
      if (!inviteCode.trim()) { setLocalError('Enter the invite code.'); return }
      party = await joinParty(inviteCode.trim(), user.id)
    }

    if (!party) return // error shown from store

    // Fetch taken characters in this party
    const { data: members } = await supabase
      .from('profiles')
      .select('character_id')
      .eq('party_id', party.id)
      .not('character_id', 'is', null)

    if (members) {
      setTakenCharIds(members.map(m => m.character_id).filter(Boolean))
    }

    setStep('character')
  }

  async function handleCharacterSelect() {
    if (!selectedChar || !user) return
    setSaving(true)

    await supabase
      .from('profiles')
      .update({ character_id: selectedChar })
      .eq('id', user.id)

    await fetchProfile(user.id)
    setSaving(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-parchment-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {/* ---- Step 1: Party ---- */}
          {step === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🚢</div>
                <h1 className="font-display text-xl text-ink-900">Assemble Your Crew</h1>
                <p className="font-body text-sm text-ink-500 mt-2 italic">
                  Create a new crew or join an existing one.
                </p>
              </div>

              {/* Mode toggle */}
              <div className="flex rounded border border-parchment-400 overflow-hidden mb-5">
                {(['create', 'join'] as PartyMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 font-heading text-xs uppercase tracking-wider transition-colors ${
                      mode === m
                        ? 'bg-ink-900 text-parchment-50'
                        : 'bg-parchment-100 text-ink-600 hover:bg-parchment-200'
                    }`}
                  >
                    {m === 'create' ? '⚓ New Crew' : '🏴‍☠️ Join Crew'}
                  </button>
                ))}
              </div>

              <div className="card-parchment p-5">
                <form onSubmit={handlePartyStep} className="flex flex-col gap-4">
                  {mode === 'create' ? (
                    <Input
                      label="Crew Name"
                      placeholder="e.g. Straw Hat Pirates"
                      value={partyName}
                      onChange={e => setPartyName(e.target.value)}
                      required
                    />
                  ) : (
                    <Input
                      label="Invite Code"
                      placeholder="e.g. A3F7K2"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      className="font-mono tracking-widest text-center text-lg"
                      maxLength={6}
                      required
                    />
                  )}

                  {(error || localError) && (
                    <p className="text-xs text-wanted-600 bg-wanted-50 border border-wanted-200 rounded px-3 py-2">
                      {error || localError}
                    </p>
                  )}

                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    {mode === 'create' ? 'Found the Crew' : 'Come Aboard'}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ---- Step 2: Character ---- */}
          {step === 'character' && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">👥</div>
                <h1 className="font-display text-xl text-ink-900">Choose Your Role</h1>
                <p className="font-body text-sm text-ink-500 mt-2 italic">
                  Pick your crew member. More join as you progress.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {characters.map(char => {
                  const taken = takenCharIds.includes(char.id)
                  const selected = selectedChar === char.id
                  return (
                    <button
                      key={char.id}
                      onClick={() => !taken && setSelectedChar(char.id)}
                      disabled={taken}
                      className={`relative card-parchment p-3 text-left transition-all ${
                        selected
                          ? 'ring-2 ring-sea-500 bg-sea-50'
                          : taken
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:shadow-parchment-lg cursor-pointer'
                      }`}
                    >
                      <div className="text-2xl mb-1">{char.avatar_emoji}</div>
                      <div className="font-heading font-semibold text-sm text-ink-900">{char.name}</div>
                      <div className="font-body text-xs text-ink-500 mt-0.5">{char.role}</div>
                      <div className="font-body text-[10px] text-sea-700 mt-1 leading-tight">{char.class_bonus}</div>
                      {taken && (
                        <div className="absolute top-2 right-2 font-heading text-[9px] uppercase text-wanted-600 bg-wanted-50 border border-wanted-200 rounded px-1">
                          Taken
                        </div>
                      )}
                      {selected && (
                        <div className="absolute top-2 right-2 text-sea-500 text-sm">✓</div>
                      )}
                    </button>
                  )
                })}
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={!selectedChar}
                loading={saving}
                onClick={handleCharacterSelect}
              >
                Set Sail
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}