import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, phone, groupSize, budget, notes } = body

    if (!eventId || !name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from('xc_vip_requests').insert({
      app_id: APP_ID,
      event_id: eventId,
      registration_id: null,
      name,
      phone: String(phone).replace(/\D/g, ''),
      group_size: groupSize || null,
      budget: budget || null,
      notes: notes || null,
    })

    if (error) {
      console.error('VIP request error:', error)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
