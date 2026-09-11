'use client'

import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { Calendar, MapPin, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import QRCode from 'react-qr-code'
import type { AccessRequest } from '@/lib/types'
import { effectiveCutoffTime } from '@/lib/access-status'

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

interface Props {
  accessRequest: AccessRequest
  guestNumber: number
}

// One ticket per guest -- a party of 3 gets 3 of these, each with its own
// QR code, so each person can be scanned in independently at the door
// instead of one scan covering the whole group.
export function TicketCard({ accessRequest, guestNumber }: Props) {
  const { member, event, access_code, guest_count, celebration_type, celebration_other, checked_in_guests } =
    accessRequest
  const club = event?.club
  if (!event || !club) return null

  const checkInUrl = `https://xclusivechicago.com/admin/checkin/${access_code}/${guestNumber}`
  const isCheckedIn = checked_in_guests.some((g) => g.guest_number === guestNumber)
  const cutoffTime = effectiveCutoffTime(event, club)
  const guestLabel =
    guestNumber === 1
      ? `${member?.first_name} ${member?.last_name}`
      : `Guest of ${member?.first_name} ${member?.last_name}`

  return (
    <div className="relative bg-card border border-gold/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.08)]">
      {/* Header -- the logo is the main visual, sized to be recognized at a
          glance by door staff who are eyeballing tickets, not scanning them. */}
      <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
        <div className="absolute top-6 right-6">
          {isCheckedIn ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Checked In
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">Valid</span>
          )}
        </div>
        <div className="flex flex-col items-center text-center pt-1">
          <div className="w-20 h-20 relative mb-2 drop-shadow-[0_0_16px_rgba(212,175,55,0.35)]">
            <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" priority />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {guest_count > 1 ? `Ticket ${guestNumber} of ${guest_count}` : 'Your Ticket'}
          </p>
        </div>
      </div>

      {/* Guest + event info */}
      <div className="px-6 py-5 border-b border-border/30 space-y-3">
        <p className="font-medium text-lg">{guestLabel}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gold shrink-0" />
            <span>
              {event.title} · {format(parseISO(event.event_date), 'EEEE, MMMM d')}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gold shrink-0" />
            <span>{club.name}</span>
          </div>
          {cutoffTime && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gold shrink-0" />
              <span>Free entry before {formatTime(cutoffTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* QR code */}
      <div className="px-6 py-6 text-center">
        <div className="bg-white p-4 rounded-2xl inline-block mb-3">
          <QRCode value={checkInUrl} size={160} level="H" />
        </div>
        <p className="text-sm text-muted-foreground">Show this to staff at the door</p>
      </div>

      {celebration_type && guestNumber === 1 && (
        <div className="px-6 pb-6">
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Celebrating</p>
              <p className="text-sm font-medium">
                {celebration_type === 'Other' ? celebration_other : celebration_type}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Decorative notches, matching a real ticket stub */}
      <div className="absolute left-0 top-[calc(100%-100px)] w-4 h-8 bg-background rounded-r-full" />
      <div className="absolute right-0 top-[calc(100%-100px)] w-4 h-8 bg-background rounded-l-full" />
    </div>
  )
}
