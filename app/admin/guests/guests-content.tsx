'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
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
  CalendarCheck,
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

  const needsAction = (member: Member) => {
    const memberRequests = requestsByMemberId.get(member.id) || []
    return memberRequests.some(
      (r) => r.status === 'pending' || (r.status === 'approved' && !r.rsvp_completed_at),
    )
  }

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

      {visibleMembers.length === 0 ? (
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
                    const rsvpOutstanding = mostRecent?.status === 'approved' && !mostRecent.rsvp_completed_at

                    return (
                      <div key={member.id} className="p-4 grid gap-3 sm:grid-cols-[1.3fr_1.4fr_1.3fr_auto] sm:items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/admin/guests/${member.id}`}
                              className="font-medium hover:text-gold hover:underline transition-colors"
                            >
                              {member.first_name} {member.last_name}
                            </Link>
                            {memberRequests.length > 1 && (
                              <Badge variant="outline" className="text-xs border-gold/30 text-gold shrink-0">
                                <Repeat className="w-3 h-3 mr-1" />
                                {memberRequests.length}
                              </Badge>
                            )}
                          </div>
                          {mostRecent?.event && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {mostRecent.event.title}
                              {mostRecent.event.club?.name && ` · ${mostRecent.event.club.name}`}
                            </p>
                          )}
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
                          {mostRecent ? (
                            <>
                              <Badge className={cn('border-0', STATUS_STYLES[mostRecent.status])}>{mostRecent.status}</Badge>
                              {rsvpOutstanding && (
                                <Badge className="border-0 bg-amber-500/20 text-amber-500">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  RSVP not completed
                                </Badge>
                              )}
                              {mostRecent.status === 'approved' && mostRecent.rsvp_completed_at && (
                                <Badge className="border-0 bg-green-500/20 text-green-500">
                                  <CalendarCheck className="w-3 h-3 mr-1" />
                                  RSVP confirmed
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No requests yet</span>
                          )}
                        </div>

                        {pendingRequests.length > 0 && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => updateStatus(pendingRequests[0].id, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(pendingRequests[0].id, 'denied')}>
                              <X className="w-4 h-4 mr-1" />
                              Deny
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
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
