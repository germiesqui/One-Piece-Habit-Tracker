import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  isPushSupported,
  getNotificationPermission,
  isSubscribed,
  subscribeToPush,
} from '@/lib/push'

const DISMISSED_KEY = 'glc_notif_banner_dismissed'

interface NotificationBannerProps {
  userId: string
  partyId: string | null
}

type BannerState = 'loading' | 'hidden' | 'prompt' | 'unsupported'

// ---- Dashboard banner — disappears after any decision ----
export function NotificationBanner({ userId, partyId }: NotificationBannerProps) {
  const [state, setState]     = useState<BannerState>('loading')
  const [working, setWorking] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      // Already dismissed → never show again on dashboard
      if (localStorage.getItem(DISMISSED_KEY)) { setState('hidden'); return }
      if (!isPushSupported())                   { setState('unsupported'); return }
      const permission = getNotificationPermission()
      if (permission === 'denied')              { setState('hidden'); return }
      // Already subscribed → no need to prompt
      const subscribed = await isSubscribed()
      if (subscribed) { setState('hidden'); return }
      setState('prompt')
    }
    check()
  }, [userId])

  async function handleEnable() {
    setWorking(true)
    setError(null)
    const result = await subscribeToPush(userId, partyId)
    setWorking(false)
    if (result.success) {
      localStorage.setItem(DISMISSED_KEY, '1')
      setState('hidden')
    } else {
      setError(result.error ?? 'Failed to enable notifications')
    }
  }

  function handleLater() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setState('hidden')
  }

  if (state === 'loading' || state === 'hidden' || state === 'unsupported') return null

  return (
    <AnimatePresence>
      {state === 'prompt' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-4 mt-3"
        >
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
                onClick={handleLater}
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}