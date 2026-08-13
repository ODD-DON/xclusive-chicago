import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { format, addDays } from 'date-fns'

export const dynamic = 'force-dynamic'
import { EventsContent } from './events-content'

async function getData() {
  const supabase = createServiceClient()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const futureStr = format(addDays(today, 56), 'yyyy-MM-dd')

  // Get events with clubs
  const { data: events } = await supabase
    .from('xc_events')
    .select(`
      *,
      club:xc_clubs(*)
    `)
    .eq('app_id', APP_ID)
    .gte('event_date', todayStr)
    .lte('event_date', futureStr)
    .order('event_date', { ascending: true })

  // Get clubs for creating new events
  const { data: clubs } = await supabase
    .from('xc_clubs')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Get registration counts per event
  const { data: regCounts } = await supabase
    .from('xc_registrations')
    .select('event_id')
    .eq('app_id', APP_ID)

  const countMap: Record<string, number> = {}
  regCounts?.forEach((reg) => {
    countMap[reg.event_id] = (countMap[reg.event_id] || 0) + 1
  })

  return {
    events: events || [],
    clubs: clubs || [],
    registrationCounts: countMap,
  }
}

export default async function EventsPage() {
  const data = await getData()
  return <EventsContent {...data} />
}
