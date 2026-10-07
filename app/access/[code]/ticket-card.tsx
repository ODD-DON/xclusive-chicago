'use client'

import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
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

// A perforation between the event info and the stub: dashed line with a
// half-circle punched out of each edge, like a real tear-off ticket.
function Perforation() {
  return (
    <div className="relative h-0 border-t border-dashed border-gold/30">
      <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background border border-gold/40" />
      <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background border border-gold/40" />
    </div>
  )
}

// One ticket per guest -- a party of 3 gets 3 of these, each with its own
// QR code, so each person can be scanned in independently at the door
// instead of one scan covering the whole group.
//
// Kept deliberately small: the XCLUSIVE brand band, what/when/where, and the
// guest + QR, all visible on a phone screen without scrolling. Door staff
// only need to recognize the brand and match the name.
export function TicketCard({ accessRequest, guestNumber }: Props) {
  const { member, event, access_code, guest_count, checked_in_guests } = accessRequest
  const club = event?.club
  if (!event || !club) return null

  const checkInUrl = `https://xclusivechicago.com/admin/checkin/${access_code}/${guestNumber}`
  const isCheckedIn = checked_in_guests.some((g) => g.guest_number === guestNumber)
  const cutoffTime = effectiveCutoffTime(event, club)
  const flyer = event.image_url || club.image_url
  const guestLabel =
    guestNumber === 1
      ? `${member?.first_name} ${member?.last_name}`
      : `Guest of ${member?.first_name} ${member?.last_name}`
  // Last 6 of the code, uppercased, as a human-readable reference door staff
  // can read aloud if a phone screen is cracked or the QR won't scan.
  const ticketNumber = `${access_code.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}-${guestNumber}`

  return (
    <div className="relative bg-card border border-gold/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.12)]">
      {/* Brand band -- the thing door staff look for. */}
      <div className="flex items-center justify-between gap-3 bg-black px-4 py-2.5 border-b border-gold/40">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 shrink-0">
            <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" priority />
          </div>
          <span className="text-gold-gradient text-sm font-semibold tracking-[0.3em]">XCLUSIVE</span>
        </div>
        {isCheckedIn ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gold text-background flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Checked In
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-gold border border-gold/50 uppercase tracking-wider">
            Valid
          </span>
        )}
      </div>

      {/* Event */}
      <div className="flex items-center gap-3 px-4 py-4">
        {flyer && (
          <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted border border-gold/20">
            <Image src={flyer} alt={event.title || 'Event flyer'} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 text-left">
          <h2 className="text-lg font-semibold leading-tight truncate">{event.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(parseISO(event.event_date), 'EEE, MMM d')} · {club.name}
          </p>
          {cutoffTime && <p className="text-xs text-gold mt-1">Free entry before {formatTime(cutoffTime)}</p>}
        </div>
      </div>

      <Perforation />

      {/* Stub: who it's for + QR */}
      <div className="px-4 pt-4 pb-5 text-center">
        <p className="text-[10px] text-gold uppercase tracking-[0.3em]">
          {guest_count > 1 ? `Admit One · ${guestNumber} of ${guest_count}` : 'Admit One'}
        </p>
        <p className="text-xl font-semibold mt-1 mb-3">{guestLabel}</p>
        <div className="bg-white p-3 rounded-xl inline-block">
          <QRCode value={checkInUrl} size={168} level="H" />
        </div>
        <p className="mt-2.5 font-mono text-[11px] tracking-[0.25em] text-muted-foreground">NO. {ticketNumber}</p>
      </div>
    </div>
  )
}
