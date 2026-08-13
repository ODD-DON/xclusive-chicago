'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Check,
  X,
  Phone,
  Mail,
  Instagram,
  Search,
  Repeat,
  Download,
  Copy,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

  const stats = useMemo(() => {
    const memberIdsWithBottleInterest = new Set(requests.filter((r) => r.bottle_service_interest).map((r) => r.member_id))
    const repeatMemberIds = Array.from(requestsByMemberId.entries()).filter(([, reqs]) => reqs.length > 1)
    const groupCount = groupMembers(members, requests).filter((g) => g.length > 1).length

    return {
      totalMembers: members.length,
      totalRequests: requests.length,
      repeatGuests: repeatMemberIds.length,
      bottleInterest: memberIdsWithBottleInterest.size,
      groups: groupCount,
    }
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

  const visibleMembers = members.filter((m) => matchesSearch(m) && matchesEvent(m))

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
        <StatTile label="Members" value={stats.totalMembers} />
        <StatTile label="Total Requests" value={stats.totalRequests} />
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
          <CardContent className="py-12 text-center text-muted-foreground">No guests match these filters</CardContent>
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
              <div className="space-y-2">
                {group.map((member) => {
                  const memberRequests = (requestsByMemberId.get(member.id) || []).sort(
                    (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime(),
                  )
                  const mostRecent = memberRequests[0]
                  const pendingRequests = memberRequests.filter((r) => r.status === 'pending')

                  return (
                    <Card key={member.id} className="bg-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Link
                                href={`/admin/guests/${member.id}`}
                                className="font-medium hover:text-gold hover:underline transition-colors"
                              >
                                {member.first_name} {member.last_name}
                              </Link>
                              {memberRequests.length > 1 && (
                                <Badge variant="outline" className="text-xs border-gold/30 text-gold">
                                  <Repeat className="w-3 h-3 mr-1" />
                                  {memberRequests.length} requests
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{formatPhone(member.phone)}</span>
                              </div>
                              {member.email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{member.email}</span>
                                </div>
                              )}
                              {member.instagram && <InstagramLink handle={member.instagram} />}
                            </div>
                            {mostRecent ? (
                              <p className="text-sm">
                                Most recent: {mostRecent.event?.title || 'Unknown event'}
                                {mostRecent.event?.club?.name && ` · ${mostRecent.event.club.name}`}
                                {' · '}
                                <span className={STATUS_STYLES[mostRecent.status]?.replace('bg-', 'text-').split(' ')[0] || ''}>
                                  {mostRecent.status}
                                </span>
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No requests yet</p>
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
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
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
    <span className={`inline-flex items-center gap-1 ${className || ''}`}>
      <a
        href={`https://instagram.com/${clean}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-gold hover:underline"
      >
        <Instagram className="w-3.5 h-3.5" />
        <span>@{clean}</span>
      </a>
      <button
        type="button"
        onClick={copyHandle}
        title="Copy handle"
        className="p-0.5 text-muted-foreground hover:text-gold transition-colors"
      >
        <Copy className="w-3 h-3" />
      </button>
    </span>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-light ${tone || ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
