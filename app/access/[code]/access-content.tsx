'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { Check, Clock, Calendar, MapPin, ArrowLeft, Users, Copy, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { AccessRequest } from '@/lib/types'
import confetti from 'canvas-confetti'
import { TicketCard } from './ticket-card'

interface Props {
  accessRequest: AccessRequest
}

export function AccessContent({ accessRequest }: Props) {
  const { status, member, event, access_code, guest_count } = accessRequest
  const club = event?.club
  // Always the exact link pasted into the admin, byte-for-byte -- DICE's
  // link.dice.fm short links (Branch-powered) don't tolerate appended query
  // params, they break the short link's own redirect/attribution lookup and
  // silently drop the referral tracking baked into it.
  //
  // This is now an optional, secondary action -- the venue's own ticketing
  // has had outages, so the XCLUSIVE ticket (below) is the credential that
  // actually gets a guest through the door, not a gate in front of it.
  const rsvpUrl = event?.ticket_url || null
  const [copied, setCopied] = useState(false)
  const [ticketLinkCopied, setTicketLinkCopied] = useState(false)

  const copyTicketLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setTicketLinkCopied(true)
      toast.success('Link copied')
      setTimeout(() => setTicketLinkCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  // window is only read inside these handlers (never in the component body)
  // so this component stays safe to server-render.
  const buildGroupLink = () =>
    event ? `${window.location.origin}/guestlist?event=${event.id}&ref=${access_code}` : ''
  const buildInviteMessage = (link: string) =>
    event
      ? `Hey guys, I got us complimentary access to ${club?.name || event.title} in Chicago. Just request access through my link so we can all get on the list together: ${link}`
      : ''

  const copyGroupLink = async () => {
    if (!event) return
    try {
      await navigator.clipboard.writeText(buildGroupLink())
      setCopied(true)
      toast.success('Link copied. Send it to your group.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const shareInvite = async () => {
    if (!event) return

    if (navigator.share) {
      try {
        await navigator.share({ text: buildInviteMessage(buildGroupLink()) })
        return
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        // fall through to sms/copy fallback below
      }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const smsSeparator = isIOS ? '&' : '?'
    const smsUrl = `sms:${smsSeparator}body=${encodeURIComponent(buildInviteMessage(buildGroupLink()))}`
    const win = window.open(smsUrl, '_self')
    if (!win) await copyGroupLink()
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
            Back to Guestlist
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl overflow-hidden"
        >
          {status === 'approved' && (
            <div className="p-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-gold" />
              </div>
              <h1 className="text-xl font-semibold text-gold-gradient mb-1">Access Granted</h1>
              <p className="text-sm text-muted-foreground mb-5">
                {member?.first_name}, you&apos;re on the Xclusive Chicago guest list.{' '}
                {guest_count > 1
                  ? `Here ${guest_count === 2 ? 'are your 2 tickets' : `are your ${guest_count} tickets`} for the door, one per person.`
                  : 'This is your ticket for the door.'}
              </p>
              <div className="space-y-4">
                {Array.from({ length: guest_count }, (_, i) => i + 1).map((guestNumber) => (
                  <TicketCard key={guestNumber} accessRequest={accessRequest} guestNumber={guestNumber} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Save or bookmark this page. You can also log in with your phone number at{' '}
                <Link href="/my" className="text-gold hover:underline">
                  My Access
                </Link>{' '}
                anytime to find it again.
              </p>
              <button
                type="button"
                onClick={copyTicketLink}
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-gold hover:text-gold-light transition-colors"
              >
                <Copy className="w-3 h-3" />
                {ticketLinkCopied ? 'Link Copied' : 'Copy This Link'}
              </button>
              {rsvpUrl && (
                <a
                  href={rsvpUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={markRsvpStarted}
                  className="block mt-3 text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  Also RSVP with {club?.name || 'the venue'} directly
                </a>
              )}
            </div>
          )}

          {status === 'pending' && (
            <div className="p-6 pb-4 text-center border-b border-border/30">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-semibold mb-1">Request Received</h1>
              <p className="text-sm text-muted-foreground">
                We&apos;re reviewing access requests for this event. Save this page, or log in anytime at{' '}
                <Link href="/my" className="text-gold hover:underline">
                  My Access
                </Link>{' '}
                with your phone number, your ticket will appear here once you&apos;re approved.
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
                This event is at capacity. We&apos;ll reach out if more access opens up.
              </p>
            </div>
          )}

          {status === 'denied' && (
            <div className="p-6 pb-4 text-center border-b border-border/30">
              <h1 className="text-xl font-semibold mb-1">Access Unavailable</h1>
              <p className="text-sm text-muted-foreground">This request could not be approved for this event.</p>
            </div>
          )}

          {event && status !== 'approved' && (
            <div className="p-6 space-y-3 border-t border-border/30">
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
            </div>
          )}

          {status !== 'denied' && (
            <div className="p-6 pt-4 border-t border-border/30">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground mb-2">
                Optional: invite your group
              </p>
              <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>
                  Access is per person, so bringing friends means they request their own. Share this link and
                  we&apos;ll know you&apos;re together.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/50 text-foreground hover:bg-muted"
                  onClick={shareInvite}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Text Your Group
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/50 text-foreground hover:bg-muted"
                  onClick={copyGroupLink}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Link Copied' : 'Copy Invite Link'}
                </Button>
              </div>
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
