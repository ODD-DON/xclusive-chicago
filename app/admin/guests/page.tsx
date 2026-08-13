import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'
import { format, subDays, addDays } from 'date-fns'
import { GuestsContent } from './guests-content'

async function getData() {
  const supabase = await createClient()
  const today = new Date()
  
  // Get date range (past 7 days to future 14 days)
  const startDate = format(subDays(today, 7), 'yyyy-MM-dd')
  const endDate = format(addDays(today, 14), 'yyyy-MM-dd')

  // Get registrations with related data
  const { data: registrations, error } = await supabase
    .from('xc_registrations')
    .select(`
      *,
      club:xc_clubs(name, address),
      event:xc_events(event_date, unlock_time, cutoff_time)
    `)
    .eq('app_id', APP_ID)
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching registrations:', error)
    return { registrations: [], clubs: [], events: [] }
  }

  // Get clubs for filtering
  const { data: clubs } = await supabase
    .from('xc_clubs')
    .select('id, name')
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .order('name')

  // Get unique event dates for filtering
  const eventDates = [...new Set(registrations?.map((r) => r.event_date) || [])]

  return {
    registrations: registrations || [],
    clubs: clubs || [],
    eventDates,
  }
}

export default async function GuestsPage() {
  const data = await getData()
  return <GuestsContent {...data} />
}
