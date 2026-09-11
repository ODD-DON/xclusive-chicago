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

const STATUS_COPY: Record<
  SendAccessEmailArgs['status'],
  { subject: string; eyebrow: string; heading: string; body: string; cta: string; noun: string }
> = {
  approved: {
    subject: "⭐ You're On The List, Xclusive Chicago",
    eyebrow: 'Access Granted',
    heading: "You're On The List",
    body: "you're approved. Your ticket is ready below, show it to staff at the door.",
    cta: 'View My Ticket',
    noun: 'ticket',
  },
  pending: {
    subject: 'Your Xclusive Chicago access request',
    eyebrow: 'Request Received',
    heading: "We've Got Your Request",
    body: "we're reviewing access requests for this event. Your ticket will appear at the link below the moment you're approved.",
    cta: 'Check My Status',
    noun: 'status',
  },
  waitlisted: {
    subject: "You're on the Xclusive Chicago waitlist",
    eyebrow: 'Waitlisted',
    heading: "You're On The Waitlist",
    body: "this event is at capacity. We'll reach out if more access opens up.",
    cta: 'Check My Status',
    noun: 'status',
  },
}

// Table-based layout (not flexbox/grid) and inline styles throughout --
// Outlook desktop and a chunk of mobile mail clients still render email
// with a stripped-down engine that ignores modern CSS, so this stays
// close to the lowest-common-denominator HTML email actually needs.
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

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#050505;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${copy.body}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <img src="https://xclusivechicago.com/logo.png" alt="XCLUSIVE" width="76" style="display:block; border:0;" />
              </td>
            </tr>
            <tr>
              <td style="background:#111111; border:1px solid rgba(212,175,55,0.25); border-radius:20px; padding:36px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom:8px;">
                      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#d4af37; font-weight:700;">
                        ${copy.eyebrow}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:14px;">
                      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:25px; font-weight:700; color:#ffffff; line-height:1.3;">
                        ${copy.heading}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:28px;">
                      <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:14px; line-height:1.6; color:#b8b8b8;">
                        Hey ${args.firstName}, ${copy.body}
                      </span>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a; border:1px solid rgba(212,175,55,0.3); border-radius:14px; margin-bottom:26px;">
                  <tr>
                    <td align="center" style="padding:22px 20px 16px; border-bottom:1px dashed rgba(212,175,55,0.25); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                      <span style="font-size:17px; font-weight:700; color:#ffffff;">${args.eventTitle}</span>
                      ${args.clubName ? `<br /><span style="font-size:13px; color:#999999;">${args.clubName}</span>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:16px 20px 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                      ${dateLine ? `<span style="font-size:13px; color:#d4af37; font-weight:600;">${dateLine}</span><br />` : ''}
                      <span style="font-size:12px; color:#777777;">Guest: ${args.firstName}</span>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background:#d4af37; border-radius:12px;">
                      <a href="${accessUrl}" style="display:block; padding:16px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:15px; font-weight:700; color:#0a0a0a; text-decoration:none;">
                        ${copy.cta}
                      </a>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-top:20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                      <span style="font-size:12px; line-height:1.6; color:#777777;">
                        Save this email, it&rsquo;s the fastest way back to your ${copy.noun}.
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                <span style="font-size:11px; color:#555555;">Xclusive Chicago &middot; If you didn&rsquo;t request this, you can ignore this email.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  try {
    const result = await resend.emails.send({
      from,
      to: args.to,
      subject: copy.subject,
      html,
    })
    if (result.error) return { sent: false, error: result.error.message }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
