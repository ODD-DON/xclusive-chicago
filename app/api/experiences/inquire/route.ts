import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { sendAdminPush, formatPhoneForPush } from '@/lib/push'

const EXPERIENCE_LABELS: Record<string, string> = {
  party_bus: 'Party Bus',
  boat_day: 'Boat Day',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

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
      // Everything else each form sends that doesn't have its own column
      // (trip type, package, pricing estimate, time slot, amenities,
      // occasion, etc.) -- stored as-is instead of silently dropped.
      ...details
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
        details: Object.keys(details).length > 0 ? details : null,
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

    const cleanPhone = phone.replace(/\D/g, '')
    await sendAdminPush({
      title: `New ${EXPERIENCE_LABELS[experienceType] || experienceType} Inquiry`,
      body: `${firstName} ${lastName} · ${formatPhoneForPush(cleanPhone)}${groupSize ? ` · ${groupSize} people` : ''}`,
      url: '/admin/experiences',
    })

    return NextResponse.json({ success: true, inquiry: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
