import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

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
      notes,
    } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('xc_vip_inquiries').insert({
      app_id: APP_ID,
      first_name: String(firstName).trim(),
      last_name: String(lastName).trim(),
      phone: cleanPhone,
      email: email || null,
      instagram: instagram ? String(instagram).trim().replace(/^@/, '') : null,
      target_date: targetDate || null,
      party_size: partySize ? parseInt(partySize, 10) : null,
      budget: budget || null,
      venue_preference: venuePreference || null,
      out_of_town: !!outOfTown,
      notes: notes || null,
    })

    if (error) {
      console.error('VIP inquiry error:', error)
      return NextResponse.json({ error: 'Failed to submit your inquiry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
