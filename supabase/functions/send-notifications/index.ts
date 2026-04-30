// ============================================================
// Grand Line Chronicles — Edge Function: send-notifications
// Scheduled cron: 0 8 * * * (8am UTC = 10am CEST summer)
//                 0 9 * * * (9am UTC = 10am CET winter)
//
// Deploy: supabase functions deploy send-notifications
// Schedule in Supabase dashboard → Edge Functions → send-notifications → Schedule
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidMailto  = Deno.env.get('VAPID_MAILTO')!

webpush.setVapidDetails(vapidMailto, vapidPublic, vapidPrivate)

const supabase = createClient(supabaseUrl, serviceKey)

// ---- Helpers ----
function isSaturday(): boolean {
  return new Date().getDay() === 6
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ---- Main handler ----
Deno.serve(async () => {
  try {
    const today     = todayStr()
    const saturday  = isSaturday()
    const dayOfWeek = new Date().getDay() // 0=Sun,1=Mon...6=Sat

    // Get all push subscriptions
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (subErr) throw subErr
    if (!subs?.length) return new Response('No subscriptions', { status: 200 })

    const results = await Promise.allSettled(
      subs.map(async ({ user_id, subscription }) => {

        // ---- Find pending tasks for this user ----
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, task_type, repeat_type, repeat_days')
          .eq('user_id', user_id)
          .eq('is_active', true)

        if (!tasks?.length) return

        // ---- Find completions today ----
        const { data: completions } = await supabase
          .from('completions')
          .select('task_id')
          .eq('user_id', user_id)
          .gte('completed_at', `${today}T00:00:00`)

        const completedIds = new Set((completions ?? []).map(c => c.task_id))

        // ---- Filter to pending tasks due today ----
        const pending = tasks.filter(task => {
          if (completedIds.has(task.id)) return false

          if (task.repeat_type === 'daily') return true
          if (task.repeat_type === 'none')  return false // one-off, don't nag
          if (task.repeat_type === 'weekly' && saturday) return true
          if (task.repeat_type === 'custom') {
            return (task.repeat_days ?? []).includes(dayOfWeek)
          }
          return false
        })

        if (!pending.length) return

        // ---- Build notification ----
        const count = pending.length
        const title = count === 1
          ? `Mission pending: ${pending[0].title}`
          : `${count} missions pending today`

        const body = count === 1
          ? 'Your crew is counting on you. Set sail! 🏴‍☠️'
          : `Complete your missions to advance the voyage! 🚢`

        const payload = JSON.stringify({
          title,
          body,
          icon:  '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag:   'glc-daily-reminder',
          url:   '/tasks',
        })

        // ---- Send push ----
        await webpush.sendNotification(subscription, payload)
      })
    )

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ sent, failed, total: subs.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('send-notifications error:', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
