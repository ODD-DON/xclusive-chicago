import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { chicagoTodayStr } from '@/lib/date'

export const dynamic = 'force-dynamic'
import { format, addDays } from 'date-fns'
import { Building2, Calendar, Users, Wine, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

async function getStats() {
  const supabase = createServiceClient()
  const todayStr = chicagoTodayStr()
  const futureStr = format(addDays(new Date(`${todayStr}T12:00:00`), 56), 'yyyy-MM-dd')

  // Active clubs
  const { count: clubCount } = await supabase
    .from('xc_clubs')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('is_active', true)

  // Upcoming events (next 8 weeks)
  const { count: eventCount } = await supabase
    .from('xc_events')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .lte('event_date', futureStr)

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
    .eq('status', 'pending')

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

  // Recent access requests
  const { data: recentRequests } = await supabase
    .from('xc_access_requests')
    .select(`
      id,
      status,
      requested_at,
      member:xc_members(first_name, last_name),
      event:xc_events(title, event_date, club:xc_clubs(name))
    `)
    .eq('app_id', APP_ID)
    .order('requested_at', { ascending: false })
    .limit(5)

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
    recentRequests: recentRequests || [],
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
          href="/admin/vip"
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
            <CardTitle className="text-lg font-medium">Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent requests</p>
            ) : (
              <div className="space-y-4">
                {stats.recentRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {req.member?.first_name} {req.member?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {req.event?.club?.name || req.event?.title || 'Unknown event'}
                        {req.event?.event_date && ` · ${format(new Date(req.event.event_date), 'MMM d')}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(new Date(req.requested_at))}
                    </span>
                  </div>
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
