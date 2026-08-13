import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, phone, email, smsConsent, emailConsent } = body

    if (!firstName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('xc_members').upsert(
      {
        app_id: APP_ID,
        first_name: String(firstName).trim(),
        last_name: '',
        phone: cleanPhone,
        email: email || null,
        sms_consent: !!smsConsent,
        email_consent: !!emailConsent,
        source: 'homepage_list',
      },
      { onConflict: 'app_id,phone', ignoreDuplicates: false },
    )

    if (error) {
      console.error('Member join error:', error)
      return NextResponse.json({ error: 'Failed to join the list' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
