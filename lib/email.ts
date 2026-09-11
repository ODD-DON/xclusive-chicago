import { Resend } from 'resend'

// Twilio SMS is stuck in A2P 10DLC review (rejected twice), so email is the
// only channel that can reliably deliver a guest's access link today. Every
// call is wrapped by the caller so a missing key or a delivery failure never
// blocks the actual access request from succeeding.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendAccessEmailArgs {
  to: string
  firstName: string
  eventTitle: string
  clubName?: string | null
  eventDate?: string | null
  status: 'approved' | 'pending' | 'waitlisted'
  accessCode: string
}

const STATUS_COPY: Record<SendAccessEmailArgs['status'], { subject: string; heading: string; body: string }> = {
  approved: {
    subject: 'Your Xclusive Chicago access is confirmed',
    heading: 'Access Granted',
    body: 'You\'re on the guest list. Open your ticket below, and save this email, it\'s the only way to get back to it.',
  },
  pending: {
    subject: 'Your Xclusive Chicago access request',
    heading: 'Request Received',
    body: 'We\'re reviewing access requests for this event. Save this email, your ticket will appear at the link below once you\'re approved.',
  },
  waitlisted: {
    subject: 'You\'re on the Xclusive Chicago waitlist',
    heading: 'Waitlisted',
    body: 'This event is at capacity. We\'ll reach out if more access opens up, so save this email to check your status.',
  },
}

export async function sendAccessEmail(args: SendAccessEmailArgs): Promise<{ sent: boolean; error?: string }> {
  if (!resend) return { sent: false, error: 'RESEND_API_KEY not configured' }

  const from = process.env.RESEND_FROM_EMAIL
  if (!from) return { sent: false, error: 'RESEND_FROM_EMAIL not configured' }

  const copy = STATUS_COPY[args.status]
  const accessUrl = `https://xclusivechicago.com/access/${args.accessCode}`
  const dateLine = args.eventDate
    ? new Date(`${args.eventDate}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null

  try {
    const result = await resend.emails.send({
      from,
      to: args.to,
      subject: copy.subject,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #f0f0f0; padding: 32px 24px; border-radius: 16px;">
          <p style="color: #d4af37; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; margin: 0 0 16px;">XCLUSIVE CHICAGO</p>
          <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 12px; color: #d4af37;">${copy.heading}</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #cfcfcf; margin: 0 0 20px;">
            Hey ${args.firstName}, ${copy.body}
          </p>
          <div style="background: #161616; border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="font-size: 15px; font-weight: 600; margin: 0 0 4px;">${args.eventTitle}</p>
            ${args.clubName ? `<p style="font-size: 13px; color: #999; margin: 0 0 4px;">${args.clubName}</p>` : ''}
            ${dateLine ? `<p style="font-size: 13px; color: #999; margin: 0;">${dateLine}</p>` : ''}
          </div>
          <a href="${accessUrl}" style="display: block; text-align: center; background: #d4af37; color: #0a0a0a; text-decoration: none; font-weight: 600; padding: 14px; border-radius: 10px; font-size: 14px;">
            View Your Access
          </a>
          <p style="font-size: 11px; color: #666; margin: 24px 0 0; line-height: 1.5;">
            Xclusive Chicago. If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    })
    if (result.error) return { sent: false, error: result.error.message }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
