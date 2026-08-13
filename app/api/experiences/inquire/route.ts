import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const APP_ID = 'xclusive_chicago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const {
      experienceType,
      firstName,
      lastName,
      phone,
      email,
      instagram,
      preferredDate,
      flexibleDates,
      groupSize,
      // Party Bus specific
      pickupLocation,
      dropoffLocation,
      durationHours,
      // Boat Day specific
      cruiseType,
      departureLocation,
      // VIP Table specific
      venuePreference,
      bottleBudget,
      // General
      specialRequests,
      budgetRange,
      howHeard,
    } = body

    if (!firstName || !lastName || !phone || !experienceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('xc_experience_inquiries')
      .insert({
        app_id: APP_ID,
        experience_type: experienceType,
        first_name: firstName,
        last_name: lastName,
        phone: phone.replace(/\D/g, ''),
        email: email || null,
        instagram: instagram || null,
        preferred_date: preferredDate || null,
        flexible_dates: flexibleDates || false,
        group_size: groupSize || null,
        pickup_location: pickupLocation || null,
        dropoff_location: dropoffLocation || null,
        duration_hours: durationHours || null,
        cruise_type: cruiseType || null,
        departure_location: departureLocation || null,
        venue_preference: venuePreference || null,
        bottle_budget: bottleBudget || null,
        special_requests: specialRequests || null,
        budget_range: budgetRange || null,
        how_heard: howHeard || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating inquiry:', error)
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, inquiry: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
