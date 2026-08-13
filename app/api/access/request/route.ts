import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventId,
      firstName,
      lastName,
      phone,
      email,
      instagram,
      guestCount,
      smsConsent,
      emailConsent,
      celebrationType,
      celebrationOther,
      bottleServiceInterest,
      bottleBudget,
      interestBoat,
      interestPartyBus,
      referredBy,
    } = body

    if (!eventId || !firstName || !lastName || !phone || !instagram) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!smsConsent) {
      return NextResponse.json({ error: 'SMS consent is required to request access' }, { status: 400 })
    }

    const cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: event, error: eventError } = await supabase
      .from('xc_events')
      .select('id, allocation, approval_mode, waitlist_enabled, is_active')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.is_active) {
      return NextResponse.json({ error: 'Access is closed for this release' }, { status: 400 })
    }

    // Upsert the member profile by phone so repeat requests link to one profile
    const { data: member, error: memberError } = await supabase
      .from('xc_members')
      .upsert(
        {
          app_id: APP_ID,
          first_name: String(firstName).trim(),
          last_name: String(lastName).trim(),
          phone: cleanPhone,
          email: email || null,
          instagram: String(instagram).trim().replace(/^@/, ''),
          sms_consent: !!smsConsent,
          email_consent: !!emailConsent,
          source: 'event_request',
        },
        { onConflict: 'app_id,phone' },
      )
      .select()
      .single()

    if (memberError || !member) {
      console.error('Member upsert error:', memberError)
      return NextResponse.json({ error: 'Failed to save your info' }, { status: 500 })
    }

    let status: 'approved' | 'pending' | 'waitlisted' = 'approved'

    if (event.approval_mode === 'manual') {
      status = 'pending'
    } else if (event.allocation != null) {
      const { count: approvedCount } = await supabase
        .from('xc_access_requests')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'approved')

      const remaining = event.allocation - (approvedCount || 0)
      if (remaining <= 0) {
        if (!event.waitlist_enabled) {
          return NextResponse.json({ error: 'This release is sold out' }, { status: 400 })
        }
        status = 'waitlisted'
      }
    }

    const accessCode = nanoid(10)

    let referredByCode: string | null = null
    if (referredBy && typeof referredBy === 'string') {
      const { data: referrer } = await supabase
        .from('xc_access_requests')
        .select('access_code')
        .eq('event_id', eventId)
        .eq('access_code', referredBy)
        .maybeSingle()
      referredByCode = referrer?.access_code || null
    }

    const { error: requestError } = await supabase.from('xc_access_requests').insert({
      app_id: APP_ID,
      member_id: member.id,
      event_id: eventId,
      guest_count: guestCount || 1,
      status,
      access_code: accessCode,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      celebration_type: celebrationType || null,
      celebration_other: celebrationOther || null,
      bottle_service_interest: !!bottleServiceInterest,
      interest_boat: !!interestBoat,
      interest_party_bus: !!interestPartyBus,
      referred_by_code: referredByCode,
    })

    if (requestError) {
      console.error('Access request error:', requestError)
      return NextResponse.json({ error: 'Failed to submit your request' }, { status: 500 })
    }

    if (bottleServiceInterest) {
      await supabase.from('xc_vip_requests').insert({
        app_id: APP_ID,
        event_id: eventId,
        registration_id: null,
        name: `${String(firstName).trim()} ${String(lastName).trim()}`,
        phone: cleanPhone,
        group_size: guestCount || 1,
        budget: bottleBudget || null,
        notes: 'Submitted via Request Access bottle service upsell',
      })
    }

    return NextResponse.json({ success: true, accessCode, status })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
