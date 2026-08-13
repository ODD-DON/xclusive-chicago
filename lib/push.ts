import 'server-only'
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export function formatPhoneForPush(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

interface PushPayload {
  title: string
  body: string
  url?: string
}

// Sends a push notification to every subscribed admin device. Silently
// no-ops if VAPID isn't configured, and prunes subscriptions the push
// service reports as gone (410/404) so dead endpoints don't pile up.
export async function sendAdminPush(payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.warn('Push not configured, skipping notification:', payload.title)
    return
  }

  const supabase = createServiceClient()
  const { data: subscriptions } = await supabase
    .from('xc_push_subscriptions')
    .select('*')
    .eq('app_id', APP_ID)

  if (!subscriptions?.length) return

  const body = JSON.stringify(payload)

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        )
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('xc_push_subscriptions').delete().eq('endpoint', sub.endpoint)
        } else {
          console.error('Push send error:', error)
        }
      }
    }),
  )
}
