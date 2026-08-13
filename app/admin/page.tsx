import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export const dynamic = 'force-dynamic'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { Building2, Calendar, Users, Wine, CheckCircle2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

async function getStats() {
  const supabase = createServiceClient()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  
  // Get week range for trending
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  
  // Active clubs
  const { count: clubCount } = await supabase
    .from('xc_clubs')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('is_active', true)

  // Upcoming events (next 8 weeks)
  const futureDate = format(addDays(today, 56), 'yyyy-MM-dd')
  const { count: eventCount } = await supabase
    .from('xc_events')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .lte('event_date', futureDate)

  // Total registrations
  const { count: totalRegistrations } = await supabase
    .from('xc_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)

  // Unlocked passes
  const { count: unlockedPasses } = await supabase
    .from('xc_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .not('activated_at', 'is', null)

  // VIP requests
  const { count: vipCount } = await supabase
    .from('xc_vip_requests')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)

  // Today's registrations
  const { count: todayRegistrations } = await supabase
    .from('xc_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('app_id', APP_ID)
    .eq('event_date', todayStr)

  // Recent registrations (last 5)
  const { data: recentRegistrations } = await supabase
    .from('xc_registrations')
    .select(`
      id,
      first_name,
      last_name,
      event_date,
      created_at,
      club:xc_clubs(name)
    `)
    .eq('app_id', APP_ID)
    .order('created_at', { ascending: false })
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
    clubCount: clubCount || 0,
    eventCount: eventCount || 0,
    totalRegistrations: totalRegistrations || 0,
    unlockedPasses: unlockedPasses || 0,
    vipCount: vipCount || 0,
    todayRegistrations: todayRegistrations || 0,
    recentRegistrations: recentRegistrations || [],
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
          title="Total Signups"
          value={stats.totalRegistrations}
          icon={Users}
          href="/admin/guests"
        />
        <StatCard
          title="Unlocked Passes"
          value={stats.unlockedPasses}
          icon={CheckCircle2}
          href="/admin/guests"
        />
        <StatCard
          title="VIP Requests"
          value={stats.vipCount}
          icon={Wine}
          href="/admin/vip"
        />
        <StatCard
          title="Tonight's Guests"
          value={stats.todayRegistrations}
          icon={TrendingUp}
          href="/admin/guests"
          highlight
        />
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent signups</p>
            ) : (
              <div className="space-y-4">
                {stats.recentRegistrations.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {reg.first_name} {reg.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reg.club?.name} - {format(new Date(reg.event_date), 'MMM d')}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(reg.created_at))}
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
                        event.event_date === format(new Date(), 'yyyy-MM-dd')
                          ? 'bg-gold/20 text-gold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {event.event_date === format(new Date(), 'yyyy-MM-dd')
                        ? 'Tonight'
                        : format(new Date(event.event_date), 'EEE')}
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
