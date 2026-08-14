import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID, Event, Club } from '@/lib/types'
import { chicagoTodayStr } from '@/lib/date'
import { HomeContent } from './home-content'

export const dynamic = 'force-dynamic'

async function getCurrentDrops() {
  const supabase = createServiceClient()

  const todayStr = chicagoTodayStr()

  const { data: events, error } = await supabase
    .from('xc_events')
    .select(`
      *,
      club:xc_clubs(*)
    `)
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .order('featured', { ascending: false })
    .order('event_date', { ascending: true })
    .limit(6)

  if (error) {
    console.error('Error fetching current releases:', error)
    return { events: [], approvedCounts: {} }
  }

  const eventIds = (events || []).map((e) => e.id)
  const approvedCounts: Record<string, number> = {}

  if (eventIds.length > 0) {
    const { data: approved } = await supabase
      .from('xc_access_requests')
      .select('event_id')
      .eq('app_id', APP_ID)
      .eq('status', 'approved')
      .in('event_id', eventIds)

    approved?.forEach((r) => {
      approvedCounts[r.event_id] = (approvedCounts[r.event_id] || 0) + 1
    })
  }

  return {
    events: (events || []) as (Event & { club: Club | null })[],
    approvedCounts,
  }
}

export default async function HomePage() {
  const { events, approvedCounts } = await getCurrentDrops()
  return <HomeContent events={events} approvedCounts={approvedCounts} />
}
