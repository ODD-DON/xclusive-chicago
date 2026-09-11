import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

// No SMS/email delivery guarantee exists yet, so this is the fallback way
// for a guest to get back to a ticket they lost the link to -- a phone
// number lookup against data they already gave us, no code to remember.
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    const cleanPhone = String(phone || '').replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: member } = await supabase
      .from('xc_members')
      .select('id')
      .eq('app_id', APP_ID)
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ requests: [] })
    }

    const { data: requests } = await supabase
      .from('xc_access_requests')
      .select('access_code, status, requested_at, event:xc_events(title, event_date, club:xc_clubs(name))')
      .eq('app_id', APP_ID)
      .eq('member_id', member.id)
      .order('requested_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      requests: (requests || []).map((r: any) => ({
        accessCode: r.access_code,
        status: r.status,
        eventTitle: r.event?.title || 'Event',
        clubName: r.event?.club?.name || null,
        eventDate: r.event?.event_date || null,
      })),
    })
  } catch (error) {
    console.error('[access/lookup] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
