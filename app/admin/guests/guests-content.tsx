'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Globe,
  Wine,
  Bus,
  Ship,
  Ticket,
  PartyPopper,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { chicagoTodayStr } from '@/lib/date'
import type { AccessRequest, Member, VipInquiry, ExperienceInquiry, VipRequest } from '@/lib/types'

interface GuestsContentProps {
  accessRequests: AccessRequest[]
  members: Member[]
  vipInquiries: VipInquiry[]
  experienceInquiries: ExperienceInquiry[]
  vipRequests: VipRequest[]
}

type SourceTab = 'guestlist' | 'vip' | 'experiences' | 'all'

interface NormalizedContact {
  id: string
  source: 'Guestlist' | 'VIP' | 'Party Bus' | 'Boat Day'
  firstName: string
  lastName: string
  phone: string
  email: string | null
  instagram: string | null
  city: string | null
  region: string | null
  extra: string | null
  date: string
  isBachelorette: boolean
  // VIP-only: which inquiry type this row came from, for the type filter chips.
  subtype?: 'advance' | 'dayof'
}

const EXPERIENCE_SOURCE_LABEL: Record<string, 'Party Bus' | 'Boat Day'> = {
  party_bus: 'Party Bus',
  boat_day: 'Boat Day',
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

export function GuestsContent({
  accessRequests: initialRequests,
  members,
  vipInquiries,
  experienceInquiries,
  vipRequests,
}: GuestsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState(initialRequests)
  const [eventFilter, setEventFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'all' | 'needs_action'>('all')
  const [displayMode, setDisplayMode] = useState<'guests' | 'events' | 'date'>('guests')
  const [vipTypeFilter, setVipTypeFilter] = useState<'all' | 'advance' | 'dayof'>('all')
  const [expTypeFilter, setExpTypeFilter] = useState<'all' | 'Party Bus' | 'Boat Day'>('all')
  const initialTab = searchParams.get('tab')
  const [sourceTab, setSourceTab] = useState<SourceTab>(
    initialTab === 'vip' || initialTab === 'experiences' || initialTab === 'guestlist' ? initialTab : 'all',
  )
  const highlightId = searchParams.get('inquiry')
  const [unreadCounts, setUnreadCounts] = useState<{ vip: number; experiences: number }>({ vip: 0, experiences: 0 })

  // Deep-links from push notifications land on a specific tab with the lead
  // already flagged unread -- landing here (not the tab click below) is what
  // "opening" it means, so mark it viewed and clear the nav flash right away.
  useEffect(() => {
    if (!highlightId) return
    const table = sourceTab === 'vip' ? 'vip' : sourceTab === 'experiences' ? 'experiences' : null
    if (!table) return
    fetch('/api/admin/mark-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, ids: [highlightId] }),
    })
      .then(() => window.dispatchEvent(new Event('xc:unread-counts-changed')))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchCounts = () => {
      fetch('/api/admin/unread-counts')
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setUnreadCounts(data)
        })
        .catch(() => {})
    }
    fetchCounts()
    window.addEventListener('xc:unread-counts-changed', fetchCounts)
    return () => {
      cancelled = true
      window.removeEventListener('xc:unread-counts-changed', fetchCounts)
    }
  }, [])

  // Switching into VIP or Experiences is "opening" whatever's currently
  // flagged unread there (every card is already fully visible, no
  // click-to-expand) -- clear the flash the moment the admin looks at the tab.
  const selectSourceTab = (tab: SourceTab) => {
    setSourceTab(tab)
    const table = tab === 'vip' ? 'vip' : tab === 'experiences' ? 'experiences' : null
    if (!table) return
    const unviewedIds =
      tab === 'vip'
        ? vipInquiries.filter((i) => !i.viewed_at).map((i) => i.id)
        : experienceInquiries.filter((i) => !i.viewed_at).map((i) => i.id)
    if (unviewedIds.length === 0) return
    fetch('/api/admin/mark-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, ids: unviewedIds }),
    })
      .then(() => window.dispatchEvent(new Event('xc:unread-counts-changed')))
      .catch(() => {})
  }

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

  // Upcoming first (soonest first), past events below (most recent first) --
  // makes it obvious at a glance which nights still need attention.
  const todayStr = chicagoTodayStr()
  const upcomingEventGroups = visibleEventGroups
    .filter((g) => (g.event?.event_date || '') >= todayStr)
    .sort((a, b) => new Date(a.event?.event_date || 0).getTime() - new Date(b.event?.event_date || 0).getTime())
  const pastEventGroups = visibleEventGroups
    .filter((g) => (g.event?.event_date || '') < todayStr)
    .sort((a, b) => new Date(b.event?.event_date || 0).getTime() - new Date(a.event?.event_date || 0).getTime())

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
    const header = ['First Name', 'Last Name', 'Phone', 'Email', 'Instagram', 'City', 'SMS Consent', 'Email Consent', 'Total Requests', 'Joined']
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const rows = visibleMembers.map((m) => [
      m.first_name,
      m.last_name,
      formatPhone(m.phone),
      m.email || '',
      m.instagram ? `@${m.instagram.replace(/^@/, '')}` : '',
      (requestsByMemberId.get(m.id) || []).find((r) => r.visitor_city)?.visitor_city || '',
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

  // Every customer contact, normalized across the three lead sources, for
  // the VIP / Experiences / All tabs -- a lighter "database" view than the
  // full lead-management cards on /admin/vip and /admin/experiences, meant
  // for browsing, searching, and exporting everyone in one place.
  const vipContacts: NormalizedContact[] = [
    ...vipInquiries.map((i) => ({
      id: `vip-${i.id}`,
      source: 'VIP' as const,
      firstName: i.first_name,
      lastName: i.last_name,
      phone: i.phone,
      email: i.email,
      instagram: i.instagram,
      city: i.home_city || i.visitor_city,
      region: i.home_city ? null : i.visitor_region,
      extra: [i.party_size ? `${i.party_size} people` : null, i.budget].filter(Boolean).join(' · ') || null,
      date: i.created_at,
      isBachelorette: i.celebration_type === 'Bachelorette',
      subtype: 'advance' as const,
    })),
    // Day-of bottle service requests (the upsell during guestlist RSVP) --
    // budget/notes only ever live on this table, not the access request.
    ...vipRequests.map((r) => {
      const [firstName, ...rest] = r.name.split(' ')
      return {
        id: `vipreq-${r.id}`,
        source: 'VIP' as const,
        firstName: firstName || r.name,
        lastName: rest.join(' '),
        phone: r.phone,
        email: null,
        instagram: null,
        city: null,
        region: null,
        extra: ['Day-of', r.group_size ? `${r.group_size} people` : null, r.budget].filter(Boolean).join(' · '),
        date: r.created_at,
        isBachelorette: false,
        subtype: 'dayof' as const,
      }
    }),
  ]

  const experienceContacts: NormalizedContact[] = experienceInquiries.map((i) => ({
    id: `exp-${i.id}`,
    source: EXPERIENCE_SOURCE_LABEL[i.experience_type] || 'Party Bus',
    firstName: i.first_name,
    lastName: i.last_name,
    phone: i.phone,
    email: i.email,
    instagram: i.instagram,
    city: i.visitor_city,
    region: i.visitor_region,
    extra: i.group_size != null ? `${i.group_size} people` : null,
    date: i.created_at,
    isBachelorette: (i.details as Record<string, unknown> | null)?.celebrationType === 'Bachelorette',
  }))

  const guestlistContacts: NormalizedContact[] = members.map((m) => {
    const memberRequests = requestsByMemberId.get(m.id) || []
    const mostRecent = memberRequests[0]
    return {
      id: `gl-${m.id}`,
      source: 'Guestlist',
      firstName: m.first_name,
      lastName: m.last_name,
      phone: m.phone,
      email: m.email,
      instagram: m.instagram,
      city: mostRecent?.visitor_city || null,
      region: mostRecent?.visitor_region || null,
      extra: mostRecent?.event?.title || null,
      date: mostRecent?.requested_at || m.created_at,
      isBachelorette: memberRequests.some((r) => r.celebration_type === 'Bachelorette'),
    }
  })

  const allContacts = [...guestlistContacts, ...vipContacts, ...experienceContacts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const matchesContactSearch = (c: NormalizedContact) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [c.firstName, c.lastName, c.phone, c.email, c.instagram, c.city]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  }

  const visibleVipContacts = vipContacts
    .filter(matchesContactSearch)
    .filter((c) => vipTypeFilter === 'all' || c.subtype === vipTypeFilter)
  const visibleExperienceContacts = experienceContacts
    .filter(matchesContactSearch)
    .filter((c) => expTypeFilter === 'all' || c.source === expTypeFilter)
  const visibleAllContacts = allContacts.filter(matchesContactSearch)

  const exportContacts = (contacts: NormalizedContact[], filenameLabel: string, includeSource: boolean) => {
    const header = [
      ...(includeSource ? ['Source'] : []),
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Instagram',
      'City',
      'Region',
      'Details',
      'Date',
    ]
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const rows = contacts.map((c) => [
      ...(includeSource ? [c.source] : []),
      c.firstName,
      c.lastName,
      formatPhone(c.phone),
      c.email || '',
      c.instagram ? `@${c.instagram.replace(/^@/, '')}` : '',
      c.city || '',
      c.region || '',
      c.extra || '',
      format(new Date(c.date), 'yyyy-MM-dd'),
    ])

    const csv = [header, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xclusive-${filenameLabel}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} contact${rows.length === 1 ? '' : 's'}`)
  }

  const sourceExport = () => {
    if (sourceTab === 'vip') return exportContacts(visibleVipContacts, 'vip-customers', false)
    if (sourceTab === 'experiences') return exportContacts(visibleExperienceContacts, 'experience-customers', true)
    if (sourceTab === 'all') return exportContacts(visibleAllContacts, 'all-customers', true)
    return exportCsv()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-light mb-2">Guests</h1>
          <p className="text-muted-foreground">
            {sourceTab === 'guestlist' && 'Your full guest database, grouped by who came together'}
            {sourceTab === 'vip' && 'Everyone who has inquired about VIP tables'}
            {sourceTab === 'experiences' && 'Everyone who has inquired about Party Bus or Boat Day'}
            {sourceTab === 'all' && 'Every customer across guestlist, VIP, and experiences, in one place'}
          </p>
        </div>
        <Button variant="outline" onClick={sourceExport} className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Export CSV{search || eventFilter !== 'all' ? ' (filtered)' : ''}
        </Button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit overflow-x-auto">
        {(
          [
            { key: 'all', label: 'All', icon: UsersRound },
            { key: 'guestlist', label: 'Guestlist', icon: Ticket },
            { key: 'vip', label: 'VIP', icon: Wine },
            { key: 'experiences', label: 'Experiences', icon: Bus },
          ] as { key: SourceTab; label: string; icon: typeof Wine }[]
        ).map((t) => {
          const unread = t.key === 'vip' ? unreadCounts.vip : t.key === 'experiences' ? unreadCounts.experiences : 0
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => selectSourceTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                sourceTab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground',
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {unread > 0 && (
                <span className="flex items-center gap-1 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-400">{unread}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {sourceTab === 'guestlist' && (
      <>
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
          <button
            type="button"
            onClick={() => setDisplayMode('date')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              displayMode === 'date' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground',
            )}
          >
            By Date
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
      ) : displayMode === 'events' ? (
        visibleEventGroups.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              {view === 'needs_action' ? 'Nothing needs your attention right now' : 'No signups match these filters'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {visibleEventGroups.map((g) => (
              <EventGroupCard key={g.event?.id} group={g} />
            ))}
          </div>
        )
      ) : upcomingEventGroups.length === 0 && pastEventGroups.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            {view === 'needs_action' ? 'Nothing needs your attention right now' : 'No signups match these filters'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {upcomingEventGroups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-medium uppercase tracking-wide text-gold">
                Upcoming Events ({upcomingEventGroups.length})
              </h2>
              {upcomingEventGroups.map((g) => (
                <EventGroupCard key={g.event?.id} group={g} />
              ))}
            </div>
          )}
          {pastEventGroups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Past Events ({pastEventGroups.length})
              </h2>
              {pastEventGroups.map((g) => (
                <EventGroupCard key={g.event?.id} group={g} />
              ))}
            </div>
          )}
        </div>
      )}
      </>
      )}

      {sourceTab !== 'guestlist' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, or Instagram"
            className="pl-9 bg-muted border-border/50"
          />
        </div>
      )}

      {sourceTab === 'vip' && (
        <>
          <TypeFilterChips
            value={vipTypeFilter}
            onChange={setVipTypeFilter}
            options={[
              { key: 'all', label: 'All', count: vipContacts.length },
              { key: 'advance', label: 'Advance Table', count: vipContacts.filter((c) => c.subtype === 'advance').length },
              { key: 'dayof', label: 'Bottle Service (Day-of)', count: vipContacts.filter((c) => c.subtype === 'dayof').length },
            ]}
          />
          <ContactList
            contacts={visibleVipContacts}
            emptyLabel="No VIP inquiries yet"
            highlightId={highlightId ? `vip-${highlightId}` : null}
          />
        </>
      )}
      {sourceTab === 'experiences' && (
        <>
          <TypeFilterChips
            value={expTypeFilter}
            onChange={setExpTypeFilter}
            options={[
              { key: 'all', label: 'All', count: experienceContacts.length },
              { key: 'Party Bus', label: 'Party Bus', count: experienceContacts.filter((c) => c.source === 'Party Bus').length },
              { key: 'Boat Day', label: 'Boat Day', count: experienceContacts.filter((c) => c.source === 'Boat Day').length },
            ]}
          />
          <ContactList
            contacts={visibleExperienceContacts}
            emptyLabel="No experience inquiries yet"
            highlightId={highlightId ? `exp-${highlightId}` : null}
          />
        </>
      )}
      {sourceTab === 'all' && (
        <ContactList contacts={visibleAllContacts} emptyLabel="No customers yet" showSource />
      )}
    </div>
  )
}

function TypeFilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { key: T; label: string; count: number }[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-full border transition-colors',
            value === opt.key
              ? 'bg-gold/15 border-gold/40 text-gold'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
          )}
        >
          {opt.label} <span className="opacity-60">{opt.count}</span>
        </button>
      ))}
    </div>
  )
}

function ContactList({
  contacts,
  emptyLabel,
  showSource,
  highlightId,
}: {
  contacts: NormalizedContact[]
  emptyLabel: string
  showSource?: boolean
  highlightId?: string | null
}) {
  if (contacts.length === 0) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border/50 overflow-hidden py-0">
      <div className="divide-y divide-border/50">
        {contacts.map((c) => (
          <div
            key={c.id}
            className={cn(
              'p-4 grid gap-3 sm:grid-cols-[1.3fr_1.4fr_1fr_auto] sm:items-center',
              highlightId === c.id && 'ring-2 ring-inset ring-gold bg-gold/5',
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/admin/guests/${c.phone}`} className="font-medium hover:text-gold hover:underline transition-colors">
                  {c.firstName} {c.lastName}
                </Link>
                {showSource && (
                  <Badge variant="outline" className="text-xs border-gold/30 text-gold shrink-0">
                    {c.source === 'VIP' && <Wine className="w-3 h-3 mr-1" />}
                    {c.source === 'Party Bus' && <Bus className="w-3 h-3 mr-1" />}
                    {c.source === 'Boat Day' && <Ship className="w-3 h-3 mr-1" />}
                    {c.source === 'Guestlist' && <Ticket className="w-3 h-3 mr-1" />}
                    {c.source}
                  </Badge>
                )}
                {c.isBachelorette && (
                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0 shrink-0">
                    <PartyPopper className="w-3 h-3 mr-1" />
                    Bachelorette
                  </Badge>
                )}
              </div>
              {c.extra && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.extra}</p>}
            </div>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground min-w-0">
              <ContactPhone phone={c.phone} />
              {c.email && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.instagram && <InstagramLink handle={c.instagram} />}
            </div>

            <div className="text-sm text-muted-foreground">
              {c.city && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {c.city}
                  {c.region ? `, ${c.region}` : ''}
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-right shrink-0">
              {format(new Date(c.date), 'MMM d, h:mm a')}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// A lightweight summary that links out to the full per-event dashboard
// (/admin/events/[id]) instead of re-rendering the whole guest list inline
// -- that dashboard already owns approve/deny, CSV export, and the "Copy
// List for Club" action, so duplicating it here just meant two places to
// keep in sync. RSVP-not-started stays front and center here since it's
// the number that directly costs promoter credit when it's ignored.
function EventGroupCard({ group: { event, requests: eventRequests } }: { group: { event: AccessRequest['event']; requests: AccessRequest[] } }) {
  const approved = eventRequests.filter((r) => r.status === 'approved')
  const pending = eventRequests.filter((r) => r.status === 'pending')
  const rsvpNotStarted = approved.filter((r) => !r.rsvp_completed_at)
  const thumbnail = event?.image_url || event?.club?.image_url

  return (
    <Link href={`/admin/events/${event?.id}`} className="block group">
      <Card className="bg-card border-border/50 hover:border-gold/40 transition-colors">
        <CardContent className="p-4 flex items-center gap-4">
          {thumbnail && (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
              <Image src={thumbnail} alt={event?.title || 'Event'} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate group-hover:text-gold transition-colors">{event?.title}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              {event?.club?.name && <span>{event.club.name}</span>}
              {event?.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(parseISO(event.event_date), 'EEE, MMM d')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Badge variant="outline">{eventRequests.length} signed up</Badge>
              <Badge className="border-0 bg-green-500/20 text-green-500">{approved.length} approved</Badge>
              {pending.length > 0 && (
                <Badge className="border-0 bg-amber-500/20 text-amber-500">{pending.length} pending</Badge>
              )}
              {rsvpNotStarted.length > 0 && (
                <Badge className="border-0 bg-amber-500/20 text-amber-500">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {rsvpNotStarted.length} RSVP not started
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
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
  const eventThumbnail = displayRequest?.event?.image_url || displayRequest?.event?.club?.image_url

  return (
    <div className="p-4 flex items-stretch gap-3 sm:grid sm:grid-cols-[1.3fr_1.4fr_1.3fr_auto] sm:items-center">
      {/* On mobile these four blocks stack in a plain flex column filling the
          left side, leaving the thumbnail to fill the empty space on the
          right. On sm+ `contents` drops this wrapper so its children become
          direct grid items again, matching the desktop 4-column layout. */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 sm:contents">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/guests/${member.phone}`}
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
            {displayRequest?.celebration_type === 'Bachelorette' && (
              <Badge className="text-xs bg-pink-500/20 text-pink-400 border-0 shrink-0">
                <PartyPopper className="w-3 h-3 mr-1" />
                Bachelorette
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
          {displayRequest?.visitor_city && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {displayRequest.visitor_city}
                {displayRequest.visitor_region ? `, ${displayRequest.visitor_region}` : ''}
              </span>
            </div>
          )}
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

      {/* Mobile-only: a bigger thumbnail filling the empty space on the
          right of the card. Fixed square (not stretched by the row's
          items-stretch) so the whole flyer is visible, object-contain so
          nothing gets cropped off. Desktop already fills that space with
          the contact/status/action columns, so it's hidden there. */}
      {displayRequest?.event &&
        (eventThumbnail ? (
          <div
            className="relative w-20 h-20 self-center shrink-0 rounded-lg overflow-hidden bg-muted sm:hidden"
            title={displayRequest.event.title || undefined}
          >
            <Image src={eventThumbnail} alt={displayRequest.event.title || 'Event'} fill className="object-contain" />
          </div>
        ) : (
          <div className="w-20 h-20 self-center shrink-0 rounded-lg bg-muted flex items-center justify-center sm:hidden">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
        ))}
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
