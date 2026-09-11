'use client'

import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { Calendar, MapPin, Users, CheckCircle2, Wallet, Sparkles } from 'lucide-react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import type { AccessRequest } from '@/lib/types'

interface Props {
  accessRequest: AccessRequest
  appleWalletEnabled: boolean
}

// The QR encodes a link to the admin-only check-in page, not a raw code --
// scanning it with any camera app opens that page directly, and the existing
// /admin auth wall is what stops a guest from "checking themselves in" by
// scanning their own ticket.
export function TicketCard({ accessRequest, appleWalletEnabled }: Props) {
  const { member, event, access_code, guest_count, celebration_type, celebration_other, checked_in_at } =
    accessRequest
  const club = event?.club
  if (!event || !club) return null

  const checkInUrl = `https://xclusivechicago.com/admin/checkin/${access_code}`

  return (
    <div className="relative bg-card border border-gold/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.08)]">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative shrink-0">
              <Image src="/logo.png" alt="XCLUSIVE" fill className="object-contain" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Ticket</p>
              <p className="font-medium text-gold-gradient">XCLUSIVE</p>
            </div>
          </div>
          {checked_in_at ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Checked In
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">Valid</span>
          )}
        </div>
      </div>

      {/* Guest + event info */}
      <div className="px-6 py-5 border-b border-border/30 space-y-3">
        <p className="font-medium text-lg">
          {member?.first_name} {member?.last_name}
          {guest_count > 1 && (
            <span className="text-sm text-muted-foreground font-normal ml-2">
              <Users className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />+{guest_count - 1} guest{guest_count > 2 ? 's' : ''}
            </span>
          )}
        </p>
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
        </div>
      </div>

      {/* QR code */}
      <div className="px-6 py-6 text-center">
        <div className="bg-white p-4 rounded-2xl inline-block mb-3">
          <QRCode value={checkInUrl} size={160} level="H" />
        </div>
        <p className="text-sm text-muted-foreground">Show this to staff at the door</p>
      </div>

      {celebration_type && (
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

      {/* Apple Wallet */}
      <div className="px-6 pb-6">
        <AppleWalletButton accessCode={access_code} enabled={appleWalletEnabled} />
      </div>

      {/* Decorative notches, matching a real ticket stub */}
      <div className="absolute left-0 top-[calc(100%-100px)] w-4 h-8 bg-background rounded-r-full" />
      <div className="absolute right-0 top-[calc(100%-100px)] w-4 h-8 bg-background rounded-l-full" />
    </div>
  )
}

function AppleWalletButton({ accessCode, enabled }: { accessCode: string; enabled: boolean }) {
  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        onClick={() => toast.info('Apple Wallet is being set up — check back soon')}
        title="Apple Wallet setup pending"
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/30 text-muted-foreground py-3 text-sm font-medium cursor-not-allowed"
      >
        <Wallet className="w-4 h-4" />
        Add to Apple Wallet
        <span className="text-xs opacity-70">(coming soon)</span>
      </button>
    )
  }

  return (
    <a
      href={`/api/passes/${accessCode}`}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-neutral-800 text-white py-3 text-sm font-medium transition-colors"
    >
      <Wallet className="w-4 h-4" />
      Add to Apple Wallet
    </a>
  )
}
