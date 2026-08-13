import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { format, addDays, getDay } from 'date-fns'

export async function POST() {
  try {
    const supabase = createServiceClient()

    // Get all active clubs with recurring days
    const { data: clubs, error: clubsError } = await supabase
      .from('xc_clubs')
      .select('*')
      .eq('app_id', APP_ID)
      .eq('is_active', true)
      .not('recurring_days', 'is', null)

    if (clubsError) {
      console.error('[v0] Fetch clubs error:', clubsError)
      return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 })
    }

    // Get existing events for the next 8 weeks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = format(today, 'yyyy-MM-dd')
    const futureDate = addDays(today, 56)
    const futureStr = format(futureDate, 'yyyy-MM-dd')

    const { data: existingEvents, error: eventsError } = await supabase
      .from('xc_events')
      .select('club_id, event_date')
      .eq('app_id', APP_ID)
      .gte('event_date', todayStr)
      .lte('event_date', futureStr)

    if (eventsError) {
      console.error('[v0] Fetch events error:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Create a set of existing event keys (club_id + date)
    const existingSet = new Set(
      existingEvents?.map((e) => `${e.club_id}_${e.event_date}`) || []
    )

    // Generate new events
    const newEvents: any[] = []

    clubs?.forEach((club) => {
      if (!club.recurring_days || club.recurring_days.length === 0) return

      // For each day in the next 8 weeks
      for (let i = 0; i < 56; i++) {
        const date = addDays(today, i)
        const dayOfWeek = getDay(date) // 0 = Sunday
        const dateStr = format(date, 'yyyy-MM-dd')

        // Check if this day is in the club's recurring days
        if (club.recurring_days.includes(dayOfWeek)) {
          const key = `${club.id}_${dateStr}`

          // Only create if doesn't exist
          if (!existingSet.has(key)) {
            newEvents.push({
              app_id: APP_ID,
              club_id: club.id,
              event_date: dateStr,
              unlock_time: club.default_unlock_time || '21:00:00',
              cutoff_time: club.default_cutoff_time || '23:30:00',
              is_active: true,
            })
          }
        }
      }
    })

    if (newEvents.length === 0) {
      return NextResponse.json({ success: true, created: 0 })
    }

    // Insert new events
    const { error: insertError } = await supabase
      .from('xc_events')
      .insert(newEvents)

    if (insertError) {
      console.error('[v0] Insert events error:', insertError)
      return NextResponse.json({ error: 'Failed to create events' }, { status: 500 })
    }

    return NextResponse.json({ success: true, created: newEvents.length })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
