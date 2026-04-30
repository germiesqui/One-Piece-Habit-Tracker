import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signIn } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-parchment-100 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏴‍☠️</div>
          <h1 className="font-display text-2xl text-ink-900 leading-tight">Grand Line</h1>
          <p className="font-heading text-xs uppercase tracking-[0.3em] text-ink-500 mt-1">Chronicles</p>
          <p className="font-body text-ink-600 mt-3 text-sm italic">
            "I'm going to be the King of the Pirates."
          </p>
        </div>

        {/* Card */}
        <div className="card-parchment p-6">
          <div className="section-header text-xs mb-5">Set Sail</div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="navigator@grandline.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-xs text-wanted-600 font-body bg-wanted-50 border border-wanted-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              Board the Ship
            </Button>
          </form>
        </div>

        <p className="text-center font-body text-sm text-ink-500 mt-4">
          New to the crew?{' '}
          <Link to="/register" className="text-sea-700 hover:text-sea-800 underline underline-offset-2">
            Join the voyage
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

// ---- Register Page ----
import { signUp } from '@/lib/supabase'

export function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await signUp(email, password, username)
    if (error) { setError(error.message); setLoading(false); return }
    // Session is set automatically by onAuthStateChange — just navigate
    // The onboarding page will wait for profile to be ready
    navigate('/onboarding')
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-parchment-100 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚓</div>
          <h1 className="font-display text-2xl text-ink-900 leading-tight">Join the Crew</h1>
          <p className="font-body text-ink-600 mt-2 text-sm italic">
            Every great pirate starts somewhere.
          </p>
        </div>

        <div className="card-parchment p-6">
          <div className="section-header text-xs mb-5">Create Account</div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Pirate Name"
              type="text"
              placeholder="e.g. Monkey D. Luffy"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="navigator@grandline.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />

            {error && (
              <p className="text-xs text-wanted-600 font-body bg-wanted-50 border border-wanted-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              Raise the Flag
            </Button>
          </form>
        </div>

        <p className="text-center font-body text-sm text-ink-500 mt-4">
          Already sailing?{' '}
          <Link to="/login" className="text-sea-700 hover:text-sea-800 underline underline-offset-2">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}