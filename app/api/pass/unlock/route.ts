import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passToken, lat, lng, accuracy } = body

    if (!passToken) {
      return NextResponse.json({ error: 'Missing pass token' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get registration with club info
    const { data: registration, error: fetchError } = await supabase
      .from('xc_registrations')
      .select(`
        *,
        club:xc_clubs(*),
        event:xc_events(*)
      `)
      .eq('app_id', APP_ID)
      .eq('pass_token', passToken)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    // Check if already unlocked
    if (registration.activated_at) {
      return NextResponse.json({ error: 'Pass already unlocked' }, { status: 400 })
    }

    // Check if within unlock window
    const now = new Date()
    const eventDate = new Date(registration.event_date)
    
    const unlockTime = registration.event?.unlock_time || '21:00:00'
    const cutoffTime = registration.event?.cutoff_time || '23:30:00'
    
    const [unlockHours, unlockMinutes] = unlockTime.split(':').map(Number)
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number)
    
    const unlockDateTime = new Date(eventDate)
    unlockDateTime.setHours(unlockHours, unlockMinutes, 0, 0)
    
    const cutoffDateTime = new Date(eventDate)
    cutoffDateTime.setHours(cutoffHours, cutoffMinutes, 0, 0)
    // If cutoff is before unlock (e.g., 1 AM), it's the next day
    if (cutoffHours < unlockHours) {
      cutoffDateTime.setDate(cutoffDateTime.getDate() + 1)
    }

    if (now < unlockDateTime) {
      return NextResponse.json(
        { error: 'Pass unlock window has not started yet' },
        { status: 400 }
      )
    }

    if (now > cutoffDateTime) {
      return NextResponse.json(
        { error: 'Pass unlock window has ended' },
        { status: 400 }
      )
    }

    // Calculate distance if location provided
    let distance: number | null = null
    if (lat && lng && registration.club.lat && registration.club.lng) {
      distance = calculateDistance(
        lat,
        lng,
        registration.club.lat,
        registration.club.lng
      )
    }

    // Set expiration time (valid for 4 hours from unlock)
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000)

    // Update registration - this is the GPS-verified activation (billable event)
    const { error: updateError } = await supabase
      .from('xc_registrations')
      .update({
        status: 'activated',
        unlocked_at: registration.unlocked_at || now.toISOString(), // First time pass became available
        activated_at: now.toISOString(), // GPS-verified activation
        activated_lat: lat,
        activated_lng: lng,
        activation_lat: lat,
        activation_lng: lng,
        activation_accuracy_meters: accuracy,
        activation_distance_miles: distance,
        activation_expires_at: expiresAt.toISOString(),
      })
      .eq('id', registration.id)

    if (updateError) {
      console.error('[v0] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to unlock pass' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      distance,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
