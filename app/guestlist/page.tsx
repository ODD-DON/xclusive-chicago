import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID, Event, Club } from '@/lib/types'
import { EventFeed } from './guestlist-flow'

export const dynamic = 'force-dynamic'

async function getUpcomingEvents() {
  const supabase = createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const { data: events, error } = await supabase
    .from('xc_events')
    .select(`
      *,
      club:xc_clubs(*)
    `)
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
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

export default async function GuestlistPage() {
  const { events, approvedCounts } = await getUpcomingEvents()
  return <EventFeed events={events} approvedCounts={approvedCounts} />
}
