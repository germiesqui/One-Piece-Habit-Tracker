// ============================================================
// Grand Line Chronicles — Push Notification Utilities
// ============================================================

import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

// Convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager'   in window   &&
    'Notification'  in window
  )
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

// Request permission and subscribe to push
export async function subscribeToPush(
  userId: string,
  partyId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isPushSupported()) {
      return { success: false, error: 'Push notifications not supported on this device' }
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' }
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    })

    // Save to Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id:      userId,
        party_id:     partyId,
        subscription: subscription.toJSON(),
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) throw error
    return { success: true }
  } catch (e: any) {
    console.error('subscribeToPush error:', e)
    return { success: false, error: e.message ?? 'Unknown error' }
  }
}

// Unsubscribe and remove from DB
export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
  } catch (e) {
    console.error('unsubscribeFromPush error:', e)
  }
}

// Check if currently subscribed
export async function isSubscribed(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}