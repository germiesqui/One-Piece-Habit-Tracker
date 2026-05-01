import { useState, useEffect } from 'react'
import {
  isPushSupported,
  getNotificationPermission,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push'

interface NotificationSettingsProps {
  userId: string
  partyId: string | null
}

type SettingsState = 'loading' | 'unsupported' | 'denied' | 'prompt' | 'subscribed'

// ---- Profile page notification settings — always visible ----
export function NotificationSettings({ userId, partyId }: NotificationSettingsProps) {
  const [state, setState]     = useState<SettingsState>('loading')
  const [working, setWorking] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      if (!isPushSupported())                    { setState('unsupported'); return }
      const permission = getNotificationPermission()
      if (permission === 'denied')               { setState('denied'); return }
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

  if (state === 'loading') return null

  return (
    <div className="card-parchment px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          {state === 'unsupported' && (
            <>
              <p className="font-heading text-xs uppercase tracking-wide text-ink-500">
                Notifications
              </p>
              <p className="font-body text-xs text-ink-400 italic">
                Not supported on this browser
              </p>
            </>
          )}
          {state === 'denied' && (
            <>
              <p className="font-heading text-xs uppercase tracking-wide text-ink-500">
                Notifications blocked
              </p>
              <p className="font-body text-xs text-ink-400 italic">
                Enable in your browser/system settings
              </p>
            </>
          )}
          {state === 'prompt' && (
            <>
              <p className="font-heading text-xs uppercase tracking-wide text-ink-700">
                Daily reminders
              </p>
              <p className="font-body text-xs text-ink-500 leading-snug">
                Get notified at 10am if you have missions pending
              </p>
              {error && (
                <p className="font-body text-xs text-wanted-600 mt-1">{error}</p>
              )}
            </>
          )}
          {state === 'subscribed' && (
            <>
              <p className="font-heading text-xs uppercase tracking-wide text-sea-700">
                Notifications enabled
              </p>
              <p className="font-body text-xs text-ink-500">
                Reminders at 10am for pending missions
              </p>
            </>
          )}
        </div>

        {/* Action button */}
        {state === 'prompt' && (
          <button
            onClick={handleEnable}
            disabled={working}
            className="font-heading text-xs uppercase tracking-wider text-white
                       bg-sea-600 hover:bg-sea-700 disabled:opacity-50
                       rounded px-3 py-1.5 transition-colors shrink-0"
          >
            {working ? '…' : 'Enable'}
          </button>
        )}
        {state === 'subscribed' && (
          <button
            onClick={handleDisable}
            disabled={working}
            className="font-heading text-[10px] uppercase tracking-wide text-ink-400
                       hover:text-wanted-600 transition-colors shrink-0"
          >
            {working ? '…' : 'Turn off'}
          </button>
        )}
      </div>
    </div>
  )
}
