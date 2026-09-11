import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { nanoid } from 'nanoid'
import { sendAdminPush, formatPhoneForPush, celebrationPushInfo } from '@/lib/push'
import { getVisitorGeo } from '@/lib/geo'
import { sendAccessEmail } from '@/lib/email'

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

    if (!eventId || !firstName || !lastName || !phone || !instagram || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })
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
      .select('id, title, event_date, allocation, approval_mode, waitlist_enabled, is_active, club:xc_clubs(name)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.is_active) {
      return NextResponse.json({ error: 'Access is closed for this event' }, { status: 400 })
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
          email: String(email).trim(),
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
      // Allocation is a headcount, not a request count -- a single
      // approved request can bring multiple guests, so sum guest_count
      // rather than counting rows.
      const { data: approvedRequests } = await supabase
        .from('xc_access_requests')
        .select('guest_count')
        .eq('event_id', eventId)
        .eq('status', 'approved')

      const approvedGuests = (approvedRequests || []).reduce((sum, r) => sum + (r.guest_count || 1), 0)
      const remaining = event.allocation - approvedGuests
      if (remaining <= 0) {
        if (!event.waitlist_enabled) {
          return NextResponse.json({ error: 'This event is sold out' }, { status: 400 })
        }
        status = 'waitlisted'
      }
    }

    const accessCode = nanoid(10)
    const { city: visitorCity, region: visitorRegion } = getVisitorGeo(request)

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
      visitor_city: visitorCity,
      visitor_region: visitorRegion,
    })

    if (requestError) {
      console.error('Access request error:', requestError)
      return NextResponse.json({ error: 'Failed to submit your request' }, { status: 500 })
    }

    const clubName = (event as { club?: { name?: string } | null }).club?.name || null

    // Fire-and-forget: SMS isn't available yet (Twilio A2P review), so this
    // email is the guest's only copy of their access link. A delivery
    // failure here shouldn't fail the request they already successfully
    // submitted -- sendAccessEmail swallows its own errors and just logs.
    sendAccessEmail({
      to: String(email).trim(),
      firstName: String(firstName).trim(),
      eventTitle: event.title || 'an event',
      clubName,
      eventDate: event.event_date,
      status,
      accessCode,
    }).then((result) => {
      if (!result.sent) console.error('[access email] not sent:', result.error)
    })

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

    // A star means "just a sign up, nothing else to do" -- the other
    // emojis mark exactly what's being requested so the notification
    // itself says what's needed without opening the app.
    const celebration = celebrationPushInfo(celebrationType)
    const interestEmojis: string[] = celebration ? [celebration.emoji] : []
    const interestLabels: string[] = celebration ? [celebration.label] : []
    const requestedCount = interestLabels.length
    if (bottleServiceInterest) {
      interestEmojis.push('🍾')
      interestLabels.push('Bottle')
    }
    if (interestBoat) {
      interestEmojis.push('🛥️')
      interestLabels.push('Boat')
    }
    if (interestPartyBus) {
      interestEmojis.push('🚌')
      interestLabels.push('Party Bus')
    }

    const pushTitle =
      interestLabels.length > 0
        ? `${interestEmojis.join('')} ${interestLabels.join(' + ')} ${interestLabels.length > requestedCount ? 'Requested' : 'Sign Up'}`
        : '⭐ New Sign Up'
    const eventTitle = event.title || 'an event'
    const statusNote = status === 'pending' ? ' · Needs approval' : status === 'waitlisted' ? ' · Waitlisted' : ''

    await sendAdminPush({
      title: pushTitle,
      body: `${String(firstName).trim()} ${String(lastName).trim()} · ${formatPhoneForPush(cleanPhone)} · ${eventTitle}${clubName ? ` @ ${clubName}` : ''}${bottleServiceInterest && bottleBudget ? ` · Budget: ${bottleBudget}` : ''}${statusNote}`,
      url: `/admin/guests/${member.phone}`,
    })

    return NextResponse.json({ success: true, accessCode, status })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
