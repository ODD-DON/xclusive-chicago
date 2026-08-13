'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Phone,
  Mail,
  Instagram,
  Copy,
  Check,
  X,
  Clock,
  Wine,
  Sparkles,
  Users,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { AccessRequest, Member } from '@/lib/types'

interface Props {
  member: Member
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

function copyToClipboard(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'))
}

export function GuestProfileContent({ member, accessRequests: initialRequests }: Props) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)

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

  const approvedCount = requests.filter((r) => r.status === 'approved').length
  const bottleInterestCount = requests.filter((r) => r.bottle_service_interest).length
  const firstSeen = requests.length
    ? requests.reduce((earliest, r) => (r.requested_at < earliest ? r.requested_at : earliest), requests[0].requested_at)
    : member.created_at

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/admin/guests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Guests
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-light mb-1">
            {member.first_name} {member.last_name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Member since {format(new Date(member.created_at), 'MMMM d, yyyy')} &middot; Joined via{' '}
            {member.source || 'unknown'}
          </p>
        </div>
        <Badge className="capitalize">{member.member_status}</Badge>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{formatPhone(member.phone)}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(member.phone, 'Phone')}
              className="p-1 text-muted-foreground hover:text-gold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {member.email && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{member.email}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(member.email!, 'Email')}
                className="p-1 text-muted-foreground hover:text-gold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {member.instagram && (
            <div className="flex items-center justify-between gap-2">
              <a
                href={`https://instagram.com/${member.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-gold hover:underline"
              >
                <Instagram className="w-4 h-4" />
                <span>@{member.instagram.replace(/^@/, '')}</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(`@${member.instagram!.replace(/^@/, '')}`, 'Handle')}
                className="p-1 text-muted-foreground hover:text-gold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
            <Badge variant="outline" className={member.sms_consent ? 'border-green-500/30 text-green-500' : 'text-muted-foreground'}>
              <MessageSquare className="w-3 h-3 mr-1" />
              SMS {member.sms_consent ? 'opted in' : 'not opted in'}
            </Badge>
            <Badge variant="outline" className={member.email_consent ? 'border-green-500/30 text-green-500' : 'text-muted-foreground'}>
              <Mail className="w-3 h-3 mr-1" />
              Email {member.email_consent ? 'opted in' : 'not opted in'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total Requests" value={requests.length} />
        <StatTile label="Approved" value={approvedCount} tone="text-green-500" />
        <StatTile label="Bottle Interest" value={bottleInterestCount} tone="text-gold" />
        <StatTile label="First Seen" value={format(new Date(firstSeen), 'MMM d, yyyy')} isText />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Request History ({requests.length})
        </p>
        {requests.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">No requests yet</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <Card key={req.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{req.event?.title || 'Unknown event'}</p>
                        <Badge className={`${STATUS_STYLES[req.status]} border-0`}>{req.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {req.event?.club?.name}
                        {req.event?.event_date && ` · ${format(parseISO(req.event.event_date), 'MMM d, yyyy')}`}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {req.guest_count} {req.guest_count === 1 ? 'guest' : 'guests'}
                        </span>
                        {req.celebration_type && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {req.celebration_type === 'Other' ? req.celebration_other : req.celebration_type}
                          </span>
                        )}
                        {req.bottle_service_interest && (
                          <span className="flex items-center gap-1 text-gold">
                            <Wine className="w-3 h-3" />
                            Bottle service interest
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Requested {format(new Date(req.requested_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(req.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'denied')}>
                          <X className="w-4 h-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, tone, isText }: { label: string; value: number | string; tone?: string; isText?: boolean }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`${isText ? 'text-sm' : 'text-2xl'} font-light ${tone || ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
