// ============================================================
// Grand Line Chronicles — Service Worker
// Handles push notifications
// ============================================================
import { precacheAndRoute } from 'workbox-precaching'

// Precache all assets injected by vite-plugin-pwa
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST)

// @ts-ignore — self is ServiceWorkerGlobalScope here
const sw = self as ServiceWorkerGlobalScope & typeof globalThis

// ---- Push event ----
sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let payload: {
    title:   string
    body:    string
    icon?:   string
    badge?:  string
    tag?:    string
    url?:    string
  }

  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: 'Grand Line Chronicles',
      body:  event.data.text(),
    }
  }

  const options: NotificationOptions = {
    body:    payload.body,
    icon:    payload.icon  ?? '/icons/icon-192.png',
    badge:   payload.badge ?? '/icons/icon-192.png',
    tag:     payload.tag   ?? 'glc-notification',
    data:    { url: payload.url ?? '/tasks' },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    sw.registration.showNotification(payload.title, options)
  )
})

// ---- Notification click — open app ----
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/tasks'

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Focus existing window if open
        for (const client of clients) {
          if ('focus' in client) {
            client.focus()
            // @ts-ignore
            client.navigate(url)
            return
          }
        }
        // Otherwise open new window
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(url)
        }
      })
  )
})
