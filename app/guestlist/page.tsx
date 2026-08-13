import { createClient } from '@/lib/supabase/server'
import { APP_ID, Event, Club } from '@/lib/types'
import { GuestlistFlow } from './guestlist-flow'

// Auto-generate events for clubs that are missing them in the next 2 weeks
async function ensureEventsExist() {
  const supabase = await createClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  
  const twoWeeksOut = new Date(today)
  twoWeeksOut.setDate(today.getDate() + 14)
  const twoWeeksStr = twoWeeksOut.toISOString().split('T')[0]

  // Get all active clubs with their recurring days
  const { data: clubs } = await supabase
    .from('xc_clubs')
    .select('id, recurring_days, default_unlock_time, default_cutoff_time')
    .eq('app_id', APP_ID)
    .eq('is_active', true)

  if (!clubs || clubs.length === 0) return

  // Get all existing events in the next 2 weeks
  const { data: existingEvents } = await supabase
    .from('xc_events')
    .select('club_id, event_date')
    .eq('app_id', APP_ID)
    .gte('event_date', todayStr)
    .lte('event_date', twoWeeksStr)

  // Create a set of existing club_id + date combinations
  const existingSet = new Set(
    (existingEvents || []).map(e => `${e.club_id}_${e.event_date}`)
  )

  // Generate missing events for each club
  const eventsToCreate: {
    app_id: string
    club_id: string
    event_date: string
    unlock_time: string
    cutoff_time: string
    is_active: boolean
    guestlist_status: string
  }[] = []

  for (const club of clubs) {
    if (!club.recurring_days || club.recurring_days.length === 0) continue

    const currentDate = new Date(today)
    while (currentDate <= twoWeeksOut) {
      const dayOfWeek = currentDate.getDay() // 0=Sun, 4=Thu, 5=Fri, 6=Sat
      const dateStr = currentDate.toISOString().split('T')[0]
      const key = `${club.id}_${dateStr}`

      // Only Thu/Fri/Sat and if club has this day in recurring_days
      if ([4, 5, 6].includes(dayOfWeek) && 
          club.recurring_days.includes(dayOfWeek) && 
          !existingSet.has(key)) {
        eventsToCreate.push({
          app_id: APP_ID,
          club_id: club.id,
          event_date: dateStr,
          unlock_time: club.default_unlock_time || '18:00:00',
          cutoff_time: club.default_cutoff_time || '23:59:00',
          is_active: true, // Always default to Open
          guestlist_status: 'confirmed',
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  // Insert any missing events (all default to Open)
  if (eventsToCreate.length > 0) {
    await supabase.from('xc_events').insert(eventsToCreate)
  }
}

async function getAvailableEvents() {
  const supabase = await createClient()
  
  // First, ensure events exist for the next 2 weeks
  await ensureEventsExist()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // Get events for the next 2 weeks
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 14)
  const endDateStr = endDate.toISOString().split('T')[0]

  const { data: events, error } = await supabase
    .from('xc_events')
    .select(`
      *,
      club:xc_clubs(*)
    `)
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .lte('event_date', endDateStr)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching events:', error)
    return []
  }

  // Filter out events where the club is inactive
  const activeEvents = (events || []).filter(
    (event: Event & { club: Club }) => event.club?.is_active
  )

  return activeEvents as (Event & { club: Club })[]
}

interface PageProps {
  searchParams: Promise<{ ref?: string }>
}

export default async function GuestlistPage({ searchParams }: PageProps) {
  const events = await getAvailableEvents()
  const { ref } = await searchParams
  
  return <GuestlistFlow events={events} referredBy={ref || null} />
}
