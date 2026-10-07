import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { chicagoTodayStr } from '@/lib/date'

// No SMS/email delivery guarantee exists yet, so this is the guest's only
// way back into their own history -- a phone number lookup against data
// they already gave us, no code or password to remember. Powers both the
// "Find my ticket" flow and the /my account view.
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
      .select('id, first_name, last_name')
      .eq('app_id', APP_ID)
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ found: false, firstName: null, upcoming: [], past: [] })
    }

    const { data: requests } = await supabase
      .from('xc_access_requests')
      .select('access_code, status, requested_at, guest_count, event:xc_events(title, event_date, image_url, unlock_time, club:xc_clubs(name, image_url, default_unlock_time))')
      .eq('app_id', APP_ID)
      .eq('member_id', member.id)
      .order('requested_at', { ascending: false })

    const today = chicagoTodayStr()
    const normalized = (requests || []).map((r: any) => ({
      accessCode: r.access_code,
      status: r.status,
      guestCount: r.guest_count,
      eventTitle: r.event?.title || 'Event',
      clubName: r.event?.club?.name || null,
      eventDate: r.event?.event_date || null,
      imageUrl: r.event?.image_url || r.event?.club?.image_url || null,
      doorsTime: r.event?.unlock_time || r.event?.club?.default_unlock_time || null,
    }))
      // Revoked requests (e.g. duplicate signups we cancelled) are noise to the guest.
      .filter((r) => r.status !== 'denied')

    const upcoming = normalized
      .filter((r) => r.eventDate && r.eventDate >= today)
      .sort((a, b) => (a.eventDate! < b.eventDate! ? -1 : 1))
    const past = normalized
      .filter((r) => !r.eventDate || r.eventDate < today)
      .sort((a, b) => (a.eventDate! > b.eventDate! ? -1 : 1))

    return NextResponse.json({ found: true, firstName: member.first_name, upcoming, past })
  } catch (error) {
    console.error('[access/lookup] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
