'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Phone,
  MessageCircle,
  Mail,
  Instagram,
  Sparkles,
  Wine,
  Download,
  Check,
  X,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AccessRequest, Club, Event } from '@/lib/types'

interface Props {
  event: Event & { club: Club | null }
  accessRequests: AccessRequest[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-500',
  approved: 'bg-green-500/20 text-green-500',
  waitlisted: 'bg-muted text-muted-foreground',
  denied: 'bg-red-500/20 text-red-500',
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function EventDashboardContent({ event, accessRequests: initial }: Props) {
  const router = useRouter()
  const [requests, setRequests] = useState(initial)

  const approved = requests.filter((r) => r.status === 'approved')
  const pending = requests.filter((r) => r.status === 'pending')
  const waitlisted = requests.filter((r) => r.status === 'waitlisted')
  const denied = requests.filter((r) => r.status === 'denied')
  const approvedHeadcount = approved.reduce((sum, r) => sum + (r.guest_count || 1), 0)
  const bottleInterest = requests.filter((r) => r.bottle_service_interest)

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!response.ok) throw new Error('Failed to update')
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as AccessRequest['status'] } : r)))
      toast.success(`Marked ${status}`)
      router.refresh()
    } catch {
      toast.error('Failed to update request')
    }
  }

  const copyClubList = async () => {
    const lines = approved
      .sort((a, b) => (a.member?.last_name || '').localeCompare(b.member?.last_name || ''))
      .map((r) => `${r.member?.first_name} ${r.member?.last_name} (${r.guest_count} ${r.guest_count === 1 ? 'guest' : 'guests'})`)
    const text = [`${event.title} -- ${format(parseISO(event.event_date), 'EEEE, MMMM d')}`, '', ...lines].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Guest list copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const exportCsv = () => {
    const header = ['First Name', 'Last Name', 'Phone', 'Guest Count', 'Status', 'Celebration', 'Bottle Interest', 'Requested At']
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const rows = requests.map((r) => [
      r.member?.first_name || '',
      r.member?.last_name || '',
      r.member ? formatPhone(r.member.phone) : '',
      String(r.guest_count),
      r.status,
      r.celebration_type === 'Other' ? r.celebration_other || '' : r.celebration_type || '',
      r.bottle_service_interest ? 'Yes' : 'No',
      format(new Date(r.requested_at), 'yyyy-MM-dd HH:mm'),
    ])
    const csv = [header, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(event.title || 'event').replace(/\s+/g, '-').toLowerCase()}-guests-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} guest${rows.length === 1 ? '' : 's'}`)
  }

  const thumbnail = event.image_url || event.club?.image_url
  const venueName = event.club?.name || event.scraped_venue_name
  const venueAddress = event.club?.address || event.scraped_venue_address

  return (
    <div className="space-y-6">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="flex items-start gap-4 flex-wrap">
        {thumbnail && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
            <Image src={thumbnail} alt={event.title || 'Event'} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-light mb-1">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(parseISO(event.event_date), 'EEEE, MMMM d')}
            </span>
            {venueName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {venueName}
                {venueAddress ? ` · ${venueAddress}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={copyClubList}>
            <Copy className="w-4 h-4 mr-2" />
            Copy List for Club
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatTile label="Total Requests" value={requests.length} />
        <StatTile label="Approved" value={approved.length} tone="text-green-500" sub={`${approvedHeadcount} headcount`} />
        <StatTile label="Pending" value={pending.length} tone="text-amber-500" />
        <StatTile label="Waitlisted" value={waitlisted.length} />
        <StatTile label="Bottle Interest" value={bottleInterest.length} tone="text-gold" />
      </div>

      {requests.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">No requests for this event yet</CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border/50 overflow-hidden py-0">
          <div className="divide-y divide-border/50">
            {requests.map((r) => (
              <GuestRow key={r.id} request={r} onApprove={updateStatus} onDeny={updateStatus} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function GuestRow({
  request,
  onApprove,
  onDeny,
}: {
  request: AccessRequest
  onApprove: (id: string, status: string) => void
  onDeny: (id: string, status: string) => void
}) {
  const member = request.member
  if (!member) return null
  const digits = member.phone.replace(/\D/g, '')

  return (
    <div className="p-4 grid gap-3 sm:grid-cols-[1.3fr_1.4fr_1.3fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/guests/${member.id}`}
            className="font-medium hover:text-gold hover:underline transition-colors"
          >
            {member.first_name} {member.last_name}
          </Link>
          <Badge variant="outline" className="text-xs shrink-0">
            <Users className="w-3 h-3 mr-1" />
            {request.guest_count}
          </Badge>
        </div>
        {request.celebration_type && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {request.celebration_type === 'Other' ? request.celebration_other : request.celebration_type}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{formatPhone(member.phone)}</span>
          <a href={`sms:${digits}`} className="text-gold hover:text-gold-light shrink-0">
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
          <a href={`tel:${digits}`} className="text-gold hover:text-gold-light shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </a>
        </div>
        {member.email && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
        {member.instagram && (
          <a
            href={`https://instagram.com/${member.instagram.replace(/^@/, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-gold hover:underline min-w-0"
          >
            <Instagram className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">@{member.instagram.replace(/^@/, '')}</span>
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={cn('border-0', STATUS_STYLES[request.status])}>{request.status}</Badge>
        {request.bottle_service_interest && (
          <Badge className="border-0 bg-gold/20 text-gold">
            <Wine className="w-3 h-3 mr-1" />
            Bottle
          </Badge>
        )}
      </div>

      {request.status === 'pending' && (
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => onApprove(request.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white">
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDeny(request.id, 'denied')}>
            <X className="w-4 h-4 mr-1" />
            Deny
          </Button>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, tone, sub }: { label: string; value: number; tone?: string; sub?: string }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-light ${tone || ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
