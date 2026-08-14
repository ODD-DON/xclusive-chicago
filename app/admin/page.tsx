import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { chicagoTodayStr } from '@/lib/date'

export const dynamic = 'force-dynamic'
import { format } from 'date-fns'
import { Building2, Calendar, Users, Wine, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

async function getStats() {
  const supabase = createServiceClient()
  const todayStr = chicagoTodayStr()

  // Active clubs
  const { count: clubCount } = await supabase
    .from('xc_clubs')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('is_active', true)

  // Upcoming events -- no future cutoff, matching the Events admin
  // page, so this card's number always matches what clicking through
  // to it actually shows.
  const { count: eventCount } = await supabase
    .from('xc_events')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)

  // Total members
  const { count: totalMembers } = await supabase
    .from('xc_members')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)

  // Access requests needing action: pending, or approved but RSVP not completed
  const { count: pendingCount } = await supabase
    .from('xc_access_requests')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .or('status.eq.pending,and(status.eq.approved,rsvp_completed_at.is.null)')

  // VIP interest across both the day-of request form and the advance inquiry form
  const [{ count: vipRequestCount }, { count: vipInquiryCount }] = await Promise.all([
    supabase.from('xc_vip_requests').select('*', { count: 'exact', head: true }).eq('app_id', APP_ID),
    supabase.from('xc_vip_inquiries').select('*', { count: 'exact', head: true }).eq('app_id', APP_ID),
  ])
  const vipCount = (vipRequestCount || 0) + (vipInquiryCount || 0)

  // Tonight's approved guests
  const { data: todaysEvents } = await supabase
    .from('xc_events')
    .select('id')
    .eq('app_id', APP_ID)
    .eq('event_date', todayStr)
  const todaysEventIds = (todaysEvents || []).map((e) => e.id)

  let tonightCount = 0
  if (todaysEventIds.length > 0) {
    const { count } = await supabase
      .from('xc_access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('app_id', APP_ID)
      .eq('status', 'approved')
      .in('event_id', todaysEventIds)
    tonightCount = count || 0
  }

  // Recent activity across every lead source -- Guests centralizes on the
  // same idea (its default tab is "All"), so the dashboard's summary should
  // match instead of only ever showing guestlist requests.
  const [recentRequestsRes, recentVipRes, recentExpRes] = await Promise.all([
    supabase
      .from('xc_access_requests')
      .select(`
        id,
        status,
        requested_at,
        member:xc_members(first_name, last_name, phone),
        event:xc_events(title, event_date, club:xc_clubs(name))
      `)
      .eq('app_id', APP_ID)
      .order('requested_at', { ascending: false })
      .limit(5),
    supabase
      .from('xc_vip_inquiries')
      .select('id, first_name, last_name, phone, created_at')
      .eq('app_id', APP_ID)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('xc_experience_inquiries')
      .select('id, first_name, last_name, phone, experience_type, created_at')
      .eq('app_id', APP_ID)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const EXPERIENCE_LABELS: Record<string, string> = { party_bus: 'Party Bus', boat_day: 'Boat Day' }

  const recentActivity = [
    ...(recentRequestsRes.data || []).map((r: any) => ({
      id: `ar-${r.id}`,
      source: 'Guestlist',
      name: `${r.member?.first_name || ''} ${r.member?.last_name || ''}`.trim(),
      phone: r.member?.phone,
      detail: r.event?.club?.name || r.event?.title || 'Unknown event',
      date: r.requested_at,
    })),
    ...(recentVipRes.data || []).map((v: any) => ({
      id: `vip-${v.id}`,
      source: 'VIP',
      name: `${v.first_name} ${v.last_name}`.trim(),
      phone: v.phone,
      detail: 'Advance table inquiry',
      date: v.created_at,
    })),
    ...(recentExpRes.data || []).map((e: any) => ({
      id: `exp-${e.id}`,
      source: EXPERIENCE_LABELS[e.experience_type] || 'Experience',
      name: `${e.first_name} ${e.last_name}`.trim(),
      phone: e.phone,
      detail: EXPERIENCE_LABELS[e.experience_type] || 'Experience inquiry',
      date: e.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Upcoming events list
  const { data: upcomingEvents } = await supabase
    .from('xc_events')
    .select(`
      id,
      event_date,
      club:xc_clubs(name)
    `)
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .order('event_date', { ascending: true })
    .limit(5)

  return {
    todayStr,
    clubCount: clubCount || 0,
    eventCount: eventCount || 0,
    totalMembers: totalMembers || 0,
    pendingCount: pendingCount || 0,
    vipCount,
    tonightCount,
    recentActivity,
    upcomingEvents: upcomingEvents || [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your guest list system</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Active Clubs"
          value={stats.clubCount}
          icon={Building2}
          href="/admin/clubs"
        />
        <StatCard
          title="Upcoming Events"
          value={stats.eventCount}
          icon={Calendar}
          href="/admin/events"
        />
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          href="/admin/guests"
        />
        <StatCard
          title="Needs Action"
          value={stats.pendingCount}
          icon={Clock}
          href="/admin/guests"
          highlight={stats.pendingCount > 0}
        />
        <StatCard
          title="VIP Requests"
          value={stats.vipCount}
          icon={Wine}
          href="/admin/guests?tab=vip"
        />
        <StatCard
          title="Tonight's Guests"
          value={stats.tonightCount}
          icon={TrendingUp}
          href="/admin/guests"
          highlight
        />
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((item: any) => (
                  <Link
                    key={item.id}
                    href={item.phone ? `/admin/guests/${item.phone}` : '/admin/guests'}
                    className="flex items-center justify-between gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        <span className="text-gold">{item.source}</span> · {item.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(new Date(item.date))}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{event.club?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), 'EEEE, MMMM d')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        event.event_date === stats.todayStr
                          ? 'bg-gold/20 text-gold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {event.event_date === stats.todayStr ? 'Tonight' : format(new Date(event.event_date), 'EEE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  highlight,
}: {
  title: string
  value: number
  icon: any
  href: string
  highlight?: boolean
}) {
  return (
    <Link href={href}>
      <Card
        className={`bg-card border-border/50 hover:border-gold/30 transition-all cursor-pointer ${
          highlight ? 'border-gold/30 bg-gold/5' : ''
        }`}
      >
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                highlight ? 'bg-gold/20' : 'bg-muted'
              }`}
            >
              <Icon className={`w-5 h-5 ${highlight ? 'text-gold' : 'text-muted-foreground'}`} />
            </div>
          </div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
