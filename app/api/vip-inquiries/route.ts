import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { sendAdminPush, formatPhoneForPush } from '@/lib/push'
import { getVisitorGeo } from '@/lib/geo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      email,
      instagram,
      targetDate,
      partySize,
      budget,
      venuePreference,
      outOfTown,
      homeCity,
      celebrationType,
      celebrationOther,
      smsConsent,
      notes,
    } = body

    if (!firstName || !lastName || !phone || !instagram) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!smsConsent) {
      return NextResponse.json({ error: 'SMS consent is required' }, { status: 400 })
    }

    const cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { city: visitorCity, region: visitorRegion } = getVisitorGeo(request)

    const { data: inquiry, error } = await supabase
      .from('xc_vip_inquiries')
      .insert({
        app_id: APP_ID,
        first_name: String(firstName).trim(),
        last_name: String(lastName).trim(),
        phone: cleanPhone,
        email: email || null,
        instagram: String(instagram).trim().replace(/^@/, ''),
        target_date: targetDate || null,
        party_size: partySize ? parseInt(partySize, 10) : null,
        budget: budget || null,
        venue_preference: venuePreference || null,
        out_of_town: !!outOfTown,
        home_city: homeCity || null,
        celebration_type: celebrationType || null,
        celebration_other: celebrationOther || null,
        sms_consent: !!smsConsent,
        notes: notes || null,
        visitor_city: visitorCity,
        visitor_region: visitorRegion,
      })
      .select('id')
      .single()

    if (error || !inquiry) {
      console.error('VIP inquiry error:', error)
      return NextResponse.json({ error: 'Failed to submit your inquiry' }, { status: 500 })
    }

    const details = [
      partySize ? `${partySize} people` : null,
      budget || null,
      targetDate ? `for ${targetDate}` : null,
      outOfTown ? 'out of town' : null,
    ].filter(Boolean)

    await sendAdminPush({
      title: 'New VIP Table Inquiry',
      body: `${String(firstName).trim()} ${String(lastName).trim()} · ${formatPhoneForPush(cleanPhone)}${
        details.length ? ` · ${details.join(', ')}` : ''
      }`,
      url: `/admin/guests?tab=vip&inquiry=${inquiry.id}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
