import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { chicagoTodayStr } from '@/lib/date'

export const dynamic = 'force-dynamic'
import { EventsContent } from './events-content'

async function getData() {
  const supabase = createServiceClient()
  const todayStr = chicagoTodayStr()

  // Get events with clubs -- upcoming (today or later) and past, no
  // artificial future cutoff so nothing scheduled further out silently
  // disappears from the list.
  const { data: upcomingEvents } = await supabase
    .from('xc_events')
    .select(`
      *,
      club:xc_clubs(*)
    `)
    .eq('app_id', APP_ID)
    .gte('event_date', todayStr)
    .order('event_date', { ascending: true })

  const { data: pastEvents } = await supabase
    .from('xc_events')
    .select(`
      *,
      club:xc_clubs(*)
    `)
    .eq('app_id', APP_ID)
    .lt('event_date', todayStr)
    .order('event_date', { ascending: false })

  // Get clubs for creating new events
  const { data: clubs } = await supabase
    .from('xc_clubs')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Access request counts per event: total (for the delete guard) and
  // approved-only (for computing each event's access status/remaining passes)
  const { data: accessRequests } = await supabase
    .from('xc_access_requests')
    .select('event_id, status')
    .eq('app_id', APP_ID)

  const requestCounts: Record<string, number> = {}
  const approvedCounts: Record<string, number> = {}
  accessRequests?.forEach((req) => {
    requestCounts[req.event_id] = (requestCounts[req.event_id] || 0) + 1
    if (req.status === 'approved') {
      approvedCounts[req.event_id] = (approvedCounts[req.event_id] || 0) + 1
    }
  })

  return {
    events: upcomingEvents || [],
    pastEvents: pastEvents || [],
    clubs: clubs || [],
    requestCounts,
    approvedCounts,
    todayStr,
  }
}

export default async function EventsPage() {
  const data = await getData()
  return <EventsContent {...data} />
}
