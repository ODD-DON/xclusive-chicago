import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'
import type { CheckedInGuest } from '@/lib/types'

// Auth is already enforced by middleware.ts for every /api/admin/* route --
// this only needs to know *who* is checking guests in, for checked_in_by.
export async function POST(request: NextRequest) {
  try {
    const { accessCode, guestNumber } = await request.json()
    if (!accessCode || !guestNumber) {
      return NextResponse.json({ error: 'Missing access code or guest number' }, { status: 400 })
    }

    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    const supabase = createServiceClient()
    const { data: accessRequest, error: fetchError } = await supabase
      .from('xc_access_requests')
      .select('id, status, guest_count, checked_in_guests')
      .eq('app_id', APP_ID)
      .eq('access_code', accessCode)
      .maybeSingle()

    if (fetchError || !accessRequest) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    if (accessRequest.status !== 'approved') {
      return NextResponse.json({ error: 'This request was never approved' }, { status: 400 })
    }
    if (guestNumber < 1 || guestNumber > accessRequest.guest_count) {
      return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 })
    }

    const existing: CheckedInGuest[] = accessRequest.checked_in_guests || []
    if (existing.some((g) => g.guest_number === guestNumber)) {
      return NextResponse.json({ error: 'Already checked in', checkedInGuests: existing }, { status: 409 })
    }

    const checkedInGuests: CheckedInGuest[] = [
      ...existing,
      { guest_number: guestNumber, checked_in_at: new Date().toISOString(), checked_in_by: user?.email || null },
    ]

    const { error: updateError } = await supabase
      .from('xc_access_requests')
      .update({ checked_in_guests: checkedInGuests })
      .eq('id', accessRequest.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
    }

    return NextResponse.json({ success: true, checkedInGuests })
  } catch (error) {
    console.error('[admin/checkin] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
