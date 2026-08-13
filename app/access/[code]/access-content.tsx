'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Check, Clock, Calendar, MapPin, ArrowLeft, Users, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { AccessRequest } from '@/lib/types'
import confetti from 'canvas-confetti'

interface Props {
  accessRequest: AccessRequest
}

// Best-effort autofill: appends common prefill query params to the venue's
// ticket link. Not documented/guaranteed by DICE or SpeakEasy, but harmless
// if ignored since it's just extra query params on their own page.
function buildRsvpUrl(baseUrl: string, member: AccessRequest['member']): string {
  try {
    const url = new URL(baseUrl)
    if (member?.email) url.searchParams.set('email', member.email)
    if (member?.phone) url.searchParams.set('phone', member.phone)
    if (member?.first_name) url.searchParams.set('first_name', member.first_name)
    if (member?.last_name) url.searchParams.set('last_name', member.last_name)
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function AccessContent({ accessRequest }: Props) {
  const { status, member, event, access_code, guest_count } = accessRequest
  const club = event?.club
  const rsvpUrl = event?.ticket_url ? buildRsvpUrl(event.ticket_url, member) : null
  const [copied, setCopied] = useState(false)

  const copyGroupLink = async () => {
    if (!event) return
    const url = `${window.location.origin}/guestlist?event=${event.id}&ref=${access_code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied. Send it to your group.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  useEffect(() => {
    if (status !== 'approved') return
    const duration = 1500
    const end = Date.now() + duration
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#FFD700', '#FFF8DC'],
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#FFD700', '#FFF8DC'],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [status])

  const markRsvpStarted = () => {
    fetch(`/api/access/${access_code}/rsvp`, { method: 'POST' }).catch(() => {})
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/guestlist" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Drops
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl overflow-hidden"
        >
          {status === 'approved' && (
            <div className="p-6 pb-4 text-center border-b border-border/30">
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-gold" />
              </div>
              <h1 className="text-xl font-semibold text-gold-gradient mb-1">Access Granted</h1>
              <p className="text-sm text-muted-foreground">
                {member?.first_name}, you&apos;re on the Xclusive Chicago guest list.
              </p>
            </div>
          )}

          {status === 'pending' && (
            <div className="p-6 pb-4 text-center border-b border-border/30">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-semibold mb-1">Request Received</h1>
              <p className="text-sm text-muted-foreground">
                We&apos;re reviewing access requests for this release. We&apos;ll text you when your access is confirmed.
              </p>
            </div>
          )}

          {status === 'waitlisted' && (
            <div className="p-6 pb-4 text-center border-b border-border/30">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-semibold mb-1">You&apos;re on the Waitlist</h1>
              <p className="text-sm text-muted-foreground">
                This release is at capacity. We&apos;ll reach out if more access opens up.
              </p>
            </div>
          )}

          {status === 'denied' && (
            <div className="p-6 pb-4 text-center border-b border-border/30">
              <h1 className="text-xl font-semibold mb-1">Access Unavailable</h1>
              <p className="text-sm text-muted-foreground">This request could not be approved for this release.</p>
            </div>
          )}

          {event && (
            <div className="p-6 space-y-3">
              <div>
                <p className="font-medium text-lg">{event.title}</p>
                {club?.name && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{club.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{format(parseISO(event.event_date), 'EEEE, MMMM d')}</span>
                </div>
              </div>

              {status === 'approved' && rsvpUrl && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    One final step: complete your official venue RSVP to secure entry.
                  </p>
                  <Button
                    asChild
                    className="w-full bg-gold hover:bg-gold-light text-background"
                    onClick={markRsvpStarted}
                  >
                    <a href={rsvpUrl} target="_blank" rel="noreferrer">
                      Complete Venue RSVP
                    </a>
                  </Button>
                </div>
              )}

              {guest_count > 1 && status !== 'denied' && (
                <div className="pt-2 border-t border-border/30 mt-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                    <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>
                      Access is granted per person. Share this link so the rest of your group ({guest_count - 1} more)
                      can request their own access — we&apos;ll know you&apos;re together.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gold/30 text-gold hover:bg-gold/10"
                    onClick={copyGroupLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Link Copied' : 'Copy Invite Link'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-6 h-6 relative opacity-60">
            <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
          </div>
          <span className="text-xs text-muted-foreground">XCLUSIVE Chicago</span>
        </div>
      </div>
    </main>
  )
}
