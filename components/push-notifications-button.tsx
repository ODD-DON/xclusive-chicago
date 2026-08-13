'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

type Status = 'checking' | 'unsupported' | 'off' | 'on'

export function PushNotificationsButton() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      const existing = await registration.pushManager.getSubscription()
      setStatus(existing && Notification.permission === 'granted' ? 'on' : 'off')
    })
  }, [])

  const enable = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notifications were blocked')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        toast.error('Push isn’t configured yet')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = subscription.toJSON()
      const response = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      if (!response.ok) throw new Error('Failed to save subscription')

      setStatus('on')
      toast.success('Notifications enabled')
    } catch {
      toast.error('Could not enable notifications')
    }
  }

  const disable = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/admin/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setStatus('off')
      toast.success('Notifications disabled')
    } catch {
      toast.error('Could not disable notifications')
    }
  }

  if (status === 'checking' || status === 'unsupported') return null

  if (status === 'on') {
    return (
      <button
        onClick={disable}
        className="flex items-center gap-2 text-sm text-green-500 hover:text-muted-foreground transition-colors"
        title="Notifications are on. Tap to turn off."
      >
        <BellRing className="w-4 h-4" />
        Notifications On
      </button>
    )
  }

  return (
    <button
      onClick={enable}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Bell className="w-4 h-4" />
      Enable Notifications
    </button>
  )
}
