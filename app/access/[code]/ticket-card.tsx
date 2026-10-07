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

// A perforation between ticket sections: dashed line with a half-circle
// punched out of each edge, like a real tear-off stub.
function Perforation() {
  return (
    <div className="relative h-0 border-t border-dashed border-gold/25">
      <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background border border-gold/30" />
      <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background border border-gold/30" />
    </div>
  )
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
  const flyer = event.image_url || club.image_url
  const guestLabel =
    guestNumber === 1
      ? `${member?.first_name} ${member?.last_name}`
      : `Guest of ${member?.first_name} ${member?.last_name}`
  // Last 6 of the code, uppercased, as a human-readable reference door staff
  // can read aloud if a phone screen is cracked or the QR won't scan.
  const ticketNumber = `${access_code.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}-${guestNumber}`

  return (
    <div className="relative bg-card border border-gold/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.12)]">
      {/* The flyer is the backdrop and the guest + QR sit on it, so the one
          thing door staff need is on screen without scrolling. */}
      <div className="relative w-full aspect-square bg-muted">
        {flyer && <Image src={flyer} alt={event.title || 'Event flyer'} fill className="object-cover" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 via-60% to-black/30" />

        <div className="absolute top-4 left-4 w-12 h-12 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]">
          <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
        </div>
        <div className="absolute top-4 right-4">
          {isCheckedIn ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold text-background flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Checked In
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur text-gold border border-gold/40 uppercase tracking-wider">
              Valid
            </span>
          )}
        </div>
      </div>

      <div className="relative -mt-24 px-6 pb-6 text-center">
        <p className="text-[11px] text-gold uppercase tracking-[0.25em] mb-0.5">
          {guest_count > 1 ? `Admit One · ${guestNumber} of ${guest_count}` : 'Admit One'}
        </p>
        <p className="text-xl font-semibold mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{guestLabel}</p>
        <div className="bg-white p-3 rounded-2xl inline-block shadow-[0_0_30px_rgba(212,175,55,0.25)]">
          <QRCode value={checkInUrl} size={150} level="H" />
        </div>
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-gold/90">NO. {ticketNumber}</p>
      </div>

      <Perforation />

      <div className="px-6 py-6 text-center space-y-4">
        <h2 className="text-2xl font-semibold leading-tight">{event.title}</h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-gold shrink-0" />
            <span>{format(parseISO(event.event_date), 'EEEE, MMMM d')}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-gold shrink-0" />
            <span>{club.name}</span>
          </div>
          {cutoffTime && (
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-gold shrink-0" />
              <span>Free entry before {formatTime(cutoffTime)}</span>
            </div>
          )}
        </div>

        {celebration_type && guestNumber === 1 && (
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Celebrating</p>
              <p className="text-sm font-medium">
                {celebration_type === 'Other' ? celebration_other : celebration_type}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
