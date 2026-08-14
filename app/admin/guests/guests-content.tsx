'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  Check,
  X,
  Phone,
  MessageCircle,
  Mail,
  Instagram,
  Search,
  Repeat,
  Download,
  Copy,
  UsersRound,
  AlertTriangle,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AccessRequest, Member } from '@/lib/types'

interface GuestsContentProps {
  accessRequests: AccessRequest[]
  members: Member[]
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

// A request only tells us the guest clicked through to the venue's RSVP
// page (see app/api/access/[code]/rsvp) -- there's no callback from the
// ticketing platform, so we can never confirm they actually finished it
// there. "Needs action" and the badges below reflect that honestly.
function requestNeedsAction(r: AccessRequest): boolean {
  return r.status === 'pending' || (r.status === 'approved' && !r.rsvp_completed_at)
}

// Groups members who share an invite link together: if any of a member's requests was
// made via another member's invite code, they cluster under that referring member.
function groupMembers(members: Member[], requests: AccessRequest[]): Member[][] {
  const requestsByAccessCode = new Map(requests.map((r) => [r.access_code, r]))
  const requestsByMember = new Map<string, AccessRequest[]>()
  requests.forEach((r) => {
    if (!requestsByMember.has(r.member_id)) requestsByMember.set(r.member_id, [])
    requestsByMember.get(r.member_id)!.push(r)
  })

  const leaderOf = (memberId: string): string => {
    const memberRequests = requestsByMember.get(memberId) || []
    for (const r of memberRequests) {
      if (r.referred_by_code) {
        const referrer = requestsByAccessCode.get(r.referred_by_code)
        if (referrer && referrer.member_id !== memberId) return referrer.member_id
      }
    }
    return memberId
  }

  const clusters = new Map<string, Member[]>()
  members.forEach((m) => {
    const leader = leaderOf(m.id)
    if (!clusters.has(leader)) clusters.set(leader, [])
    clusters.get(leader)!.push(m)
  })

  const earliestRequestTime = (memberId: string) => {
    const reqs = requestsByMember.get(memberId) || []
    if (!reqs.length) return Infinity
    return Math.min(...reqs.map((r) => new Date(r.requested_at).getTime()))
  }
  const latestRequestTime = (memberId: string) => {
    const reqs = requestsByMember.get(memberId) || []
    if (!reqs.length) return 0
    return Math.max(...reqs.map((r) => new Date(r.requested_at).getTime()))
  }

  const groups = Array.from(clusters.values()).map((groupMembers) =>
    [...groupMembers].sort((a, b) => earliestRequestTime(a.id) - earliestRequestTime(b.id)),
  )

  groups.sort((a, b) => {
    const aMax = Math.max(...a.map((m) => latestRequestTime(m.id)))
    const bMax = Math.max(...b.map((m) => latestRequestTime(m.id)))
    return bMax - aMax
  })

  return groups
}

export function GuestsContent({ accessRequests: initialRequests, members }: GuestsContentProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [eventFilter, setEventFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'all' | 'needs_action'>('all')
  const [displayMode, setDisplayMode] = useState<'guests' | 'events'>('guests')

  const events = useMemo(() => {
    const map = new Map<string, string>()
    requests.forEach((r) => {
      if (r.event?.id) map.set(r.event.id, r.event.title || 'Untitled event')
    })
    return Array.from(map.entries())
  }, [requests])

  const requestsByMemberId = useMemo(() => {
    const map = new Map<string, AccessRequest[]>()
    requests.forEach((r) => {
      if (!map.has(r.member_id)) map.set(r.member_id, [])
      map.get(r.member_id)!.push(r)
    })
    return map
  }, [requests])

  const needsAction = (member: Member) => (requestsByMemberId.get(member.id) || []).some(requestNeedsAction)

  const stats = useMemo(() => {
    const memberIdsWithBottleInterest = new Set(requests.filter((r) => r.bottle_service_interest).map((r) => r.member_id))
    const repeatMemberIds = Array.from(requestsByMemberId.entries()).filter(([, reqs]) => reqs.length > 1)
    const groupCount = groupMembers(members, requests).filter((g) => g.length > 1).length
    const needsActionCount = members.filter(needsAction).length

    return {
      totalMembers: members.length,
      needsAction: needsActionCount,
      totalRequests: requests.length,
      repeatGuests: repeatMemberIds.length,
      groups: groupCount,
      bottleInterest: memberIdsWithBottleInterest.size,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, requests, requestsByMemberId])

  const matchesSearch = (member: Member) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [member.first_name, member.last_name, member.phone, member.email, member.instagram]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  }

  const matchesEvent = (member: Member) => {
    if (eventFilter === 'all') return true
    return (requestsByMemberId.get(member.id) || []).some((r) => r.event?.id === eventFilter)
  }

  const matchesView = (member: Member) => {
    if (view === 'all') return true
    return needsAction(member)
  }

  const visibleMembers = members.filter((m) => matchesSearch(m) && matchesEvent(m) && matchesView(m))

  // "By Event" view: same requests, grouped by which event they're for
  // instead of who made them, so you can see headcount per release.
  const eventGroups = useMemo(() => {
    const map = new Map<string, { event: AccessRequest['event']; requests: AccessRequest[] }>()
    requests.forEach((r) => {
      if (!r.event?.id) return
      if (!map.has(r.event.id)) map.set(r.event.id, { event: r.event, requests: [] })
      map.get(r.event.id)!.requests.push(r)
    })
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.event?.event_date || 0).getTime() - new Date(a.event?.event_date || 0).getTime(),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests])

  const visibleEventGroups = eventGroups
    .filter((g) => eventFilter === 'all' || g.event?.id === eventFilter)
    .map((g) => ({
      ...g,
      requests: g.requests.filter(
        (r) => r.member && matchesSearch(r.member) && (view === 'all' || requestNeedsAction(r)),
      ),
    }))
    .filter((g) => g.requests.length > 0)

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

  const exportCsv = () => {
    const header = ['First Name', 'Last Name', 'Phone', 'Email', 'Instagram', 'SMS Consent', 'Email Consent', 'Total Requests', 'Joined']
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const rows = visibleMembers.map((m) => [
      m.first_name,
      m.last_name,
      formatPhone(m.phone),
      m.email || '',
      m.instagram ? `@${m.instagram.replace(/^@/, '')}` : '',
      m.sms_consent ? 'Yes' : 'No',
      m.email_consent ? 'Yes' : 'No',
      String((requestsByMemberId.get(m.id) || []).length),
      format(new Date(m.created_at), 'yyyy-MM-dd'),
    ])

    const csv = [header, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xclusive-guests-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} contact${rows.length === 1 ? '' : 's'}`)
  }

  const visibleGroups = groupMembers(visibleMembers, requests)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-light mb-2">Guests</h1>
          <p className="text-muted-foreground">Your full guest database, grouped by who came together</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Export CSV{search || eventFilter !== 'all' ? ' (filtered)' : ''}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatTile label="Members" value={stats.totalMembers} active={view === 'all'} onClick={() => setView('all')} />
        <StatTile
          label="Needs Action"
          value={stats.needsAction}
          tone="text-amber-500"
          active={view === 'needs_action'}
          onClick={() => setView('needs_action')}
        />
        <StatTile label="Repeat Guests" value={stats.repeatGuests} tone="text-gold" />
        <StatTile label="Groups" value={stats.groups} tone="text-gold" />
        <StatTile label="Bottle Interest" value={stats.bottleInterest} tone="text-gold" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit shrink-0">
          <button
            type="button"
            onClick={() => setDisplayMode('guests')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              displayMode === 'guests' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground',
            )}
          >
            By Guest
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('events')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              displayMode === 'events' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground',
            )}
          >
            By Event
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, or Instagram"
            className="pl-9 bg-muted border-border/50"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-muted border-border/50">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map(([id, title]) => (
              <SelectItem key={id} value={id}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {displayMode === 'guests' ? (
        visibleMembers.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              {view === 'needs_action' ? 'Nothing needs your attention right now' : 'No guests match these filters'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleGroups.map((group) => (
              <div key={group[0].id} className={group.length > 1 ? 'space-y-2 border-l-2 border-gold/40 pl-3' : ''}>
                {group.length > 1 && (
                  <p className="text-xs font-medium text-gold flex items-center gap-1.5">
                    <UsersRound className="w-3.5 h-3.5" />
                    Group of {group.length}
                  </p>
                )}
                <Card className="bg-card border-border/50 overflow-hidden py-0">
                  <div className="divide-y divide-border/50">
                    {group.map((member) => {
                      const memberRequests = (requestsByMemberId.get(member.id) || []).sort(
                        (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime(),
                      )
                      const mostRecent = memberRequests[0]
                      const pendingRequests = memberRequests.filter((r) => r.status === 'pending')

                      return (
                        <GuestRow
                          key={member.id}
                          member={member}
                          subtitle={
                            mostRecent?.event
                              ? `${mostRecent.event.title}${mostRecent.event.club?.name ? ` · ${mostRecent.event.club.name}` : ''}`
                              : undefined
                          }
                          repeatCount={memberRequests.length}
                          displayRequest={mostRecent}
                          pendingRequestId={pendingRequests[0]?.id}
                          onApprove={(id) => updateStatus(id, 'approved')}
                          onDeny={(id) => updateStatus(id, 'denied')}
                        />
                      )
                    })}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )
      ) : visibleEventGroups.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            {view === 'needs_action' ? 'Nothing needs your attention right now' : 'No signups match these filters'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {visibleEventGroups.map(({ event, requests: eventRequests }) => {
            const approved = eventRequests.filter((r) => r.status === 'approved')
            const pending = eventRequests.filter((r) => r.status === 'pending')

            return (
              <div key={event?.id}>
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <h2 className="text-lg font-medium">{event?.title}</h2>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      {event?.club?.name && <span>{event.club.name}</span>}
                      {event?.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(parseISO(event.event_date), 'EEE, MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{eventRequests.length} signed up</Badge>
                    <Badge className="border-0 bg-green-500/20 text-green-500">{approved.length} approved</Badge>
                    {pending.length > 0 && (
                      <Badge className="border-0 bg-amber-500/20 text-amber-500">{pending.length} pending</Badge>
                    )}
                  </div>
                </div>

                <Card className="bg-card border-border/50 overflow-hidden py-0">
                  <div className="divide-y divide-border/50">
                    {eventRequests.map(
                      (r) =>
                        r.member && (
                          <GuestRow
                            key={r.id}
                            member={r.member}
                            displayRequest={r}
                            pendingRequestId={r.status === 'pending' ? r.id : undefined}
                            onApprove={(id) => updateStatus(id, 'approved')}
                            onDeny={(id) => updateStatus(id, 'denied')}
                          />
                        ),
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GuestRow({
  member,
  subtitle,
  repeatCount,
  displayRequest,
  pendingRequestId,
  onApprove,
  onDeny,
}: {
  member: Member
  subtitle?: string
  repeatCount?: number
  displayRequest?: AccessRequest
  pendingRequestId?: string
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}) {
  // rsvp_completed_at is only ever set when the guest clicks through to the
  // venue's RSVP link (see app/api/access/[code]/rsvp) -- there's no
  // callback from the ticketing platform, so this can never mean "we
  // verified they finished it," only "they opened it." Badges below say
  // exactly that instead of overclaiming "confirmed."
  const rsvpNotStarted = displayRequest?.status === 'approved' && !displayRequest.rsvp_completed_at
  const rsvpOpened = displayRequest?.status === 'approved' && !!displayRequest.rsvp_completed_at

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
          {!!repeatCount && repeatCount > 1 && (
            <Badge variant="outline" className="text-xs border-gold/30 text-gold shrink-0">
              <Repeat className="w-3 h-3 mr-1" />
              {repeatCount}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground min-w-0">
        <ContactPhone phone={member.phone} />
        {member.email && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
        {member.instagram && <InstagramLink handle={member.instagram} />}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {displayRequest ? (
          <>
            <Badge className={cn('border-0', STATUS_STYLES[displayRequest.status])}>{displayRequest.status}</Badge>
            {rsvpNotStarted && (
              <Badge className="border-0 bg-amber-500/20 text-amber-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                RSVP not started
              </Badge>
            )}
            {rsvpOpened && (
              <Badge className="border-0 bg-blue-500/20 text-blue-400" title="They clicked the RSVP link -- we have no way to confirm they finished it on the venue's site">
                <ExternalLink className="w-3 h-3 mr-1" />
                RSVP link opened
              </Badge>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No requests yet</span>
        )}
      </div>

      {pendingRequestId && (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => onApprove(pendingRequestId)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDeny(pendingRequestId)}>
            <X className="w-4 h-4 mr-1" />
            Deny
          </Button>
        </div>
      )}
    </div>
  )
}

function ContactPhone({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, '')
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Phone className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{formatPhone(phone)}</span>
      <a href={`sms:${digits}`} title="Text this guest" className="text-gold hover:text-gold-light shrink-0">
        <MessageCircle className="w-3.5 h-3.5" />
      </a>
      <a href={`tel:${digits}`} title="Call this guest" className="text-gold hover:text-gold-light shrink-0">
        <Phone className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

function InstagramLink({ handle, className }: { handle: string; className?: string }) {
  const clean = handle.replace(/^@/, '')

  const copyHandle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(`@${clean}`)
      toast.success('Handle copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 min-w-0 ${className || ''}`}>
      <a
        href={`https://instagram.com/${clean}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-gold hover:underline min-w-0"
      >
        <Instagram className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">@{clean}</span>
      </a>
      <button
        type="button"
        onClick={copyHandle}
        title="Copy handle"
        className="p-0.5 text-muted-foreground hover:text-gold transition-colors shrink-0"
      >
        <Copy className="w-3 h-3" />
      </button>
    </span>
  )
}

function StatTile({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string
  value: number
  tone?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      className={cn(
        'bg-card border-border/50 transition-colors',
        onClick && 'cursor-pointer hover:border-gold/40',
        active && 'border-gold/50 bg-gold/5',
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-light ${tone || ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
