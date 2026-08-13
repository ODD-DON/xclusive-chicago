import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventId,
      clubId,
      eventDate,
      firstName,
      lastName,
      phone,
      email,
      instagram,
      friendCount,
      referredBy,
      bottleService,
      bottleBudget,
      celebrationType,
      celebrationOther,
      vipRequest,
    } = body

    // Validate required fields
    if (!eventId || !clubId || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Generate unique pass token
    const passToken = nanoid(12)
    const qrToken = nanoid(16)

    // If referredBy is provided, look up the referrer's registration ID
    let referredById: string | null = null
    if (referredBy) {
      const { data: referrer } = await supabase
        .from('xc_registrations')
        .select('id')
        .eq('pass_token', referredBy)
        .single()
      
      if (referrer) {
        referredById = referrer.id
      }
    }

    // Create registration (1 person = 1 pass)
    const { data: registration, error: registrationError } = await supabase
      .from('xc_registrations')
      .insert({
        app_id: APP_ID,
        event_id: eventId,
        club_id: clubId,
        event_date: eventDate,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        instagram: instagram,
        friend_count: friendCount || 0,
        referred_by: referredById,
        total_count: 1, // Each person gets their own pass
        bottle_service: bottleService,
        bottle_budget: bottleBudget,
        celebration_type: celebrationType,
        celebration_other: celebrationOther,
        pass_token: passToken,
        qr_token: qrToken,
        status: 'registered',
      })
      .select()
      .single()

    if (registrationError) {
      console.error('[v0] Registration error:', registrationError)
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      )
    }

    // If VIP request, create VIP record
    if (vipRequest && registration) {
      const { error: vipError } = await supabase.from('xc_vip_requests').insert({
        app_id: APP_ID,
        event_id: eventId,
        registration_id: registration.id,
        name: `${firstName} ${lastName}`,
        phone: phone,
        group_size: vipRequest.groupSize,
        budget: vipRequest.budget,
        notes: vipRequest.notes,
      })

      if (vipError) {
        console.error('[v0] VIP request error:', vipError)
        // Don't fail the whole request, just log
      }
    }

    return NextResponse.json({
      success: true,
      passToken: passToken,
      registrationId: registration.id,
    })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
