import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  isPushSupported,
  getNotificationPermission,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push'

interface NotificationBannerProps {
  userId: string
  partyId: string | null
}

type BannerState = 'loading' | 'hidden' | 'prompt' | 'subscribed' | 'unsupported'

export function NotificationBanner({ userId, partyId }: NotificationBannerProps) {
  const [state, setState]     = useState<BannerState>('loading')
  const [working, setWorking] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function check() {
      if (!isPushSupported()) { setState('unsupported'); return }
      const permission = getNotificationPermission()
      if (permission === 'denied') { setState('hidden'); return }
      const subscribed = await isSubscribed()
      setState(subscribed ? 'subscribed' : 'prompt')
    }
    check()
  }, [userId])

  async function handleEnable() {
    setWorking(true)
    setError(null)
    const result = await subscribeToPush(userId, partyId)
    setWorking(false)
    if (result.success) {
      setState('subscribed')
    } else {
      setError(result.error ?? 'Failed to enable notifications')
    }
  }

  async function handleDisable() {
    setWorking(true)
    await unsubscribeFromPush(userId)
    setWorking(false)
    setState('prompt')
  }

  // Don't show anything if unsupported, hidden, or loading
  if (state === 'loading' || state === 'unsupported' || state === 'hidden') return null
  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-4 mt-3"
      >
        {state === 'prompt' && (
          <div className="card-parchment px-4 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-xs uppercase tracking-wide text-ink-700">
                Daily reminders
              </p>
              <p className="font-body text-xs text-ink-500 leading-snug">
                Get notified at 10am if you have missions pending
              </p>
              {error && (
                <p className="font-body text-xs text-wanted-600 mt-1">{error}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDismissed(true)}
                className="font-heading text-[10px] uppercase tracking-wide text-ink-400
                           hover:text-ink-600 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleEnable}
                disabled={working}
                className="font-heading text-xs uppercase tracking-wider text-white
                           bg-sea-600 hover:bg-sea-700 disabled:opacity-50
                           rounded px-3 py-1.5 transition-colors"
              >
                {working ? '…' : 'Enable'}
              </button>
            </div>
          </div>
        )}

        {state === 'subscribed' && (
          <div className="card-parchment px-4 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">🔔</span>
            <div className="flex-1">
              <p className="font-heading text-xs uppercase tracking-wide text-sea-700">
                Notifications enabled
              </p>
              <p className="font-body text-xs text-ink-500">
                You'll be reminded at 10am if missions are pending
              </p>
            </div>
            <button
              onClick={handleDisable}
              disabled={working}
              className="font-heading text-[10px] uppercase tracking-wide text-ink-400
                         hover:text-wanted-600 transition-colors shrink-0"
            >
              {working ? '…' : 'Turn off'}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}