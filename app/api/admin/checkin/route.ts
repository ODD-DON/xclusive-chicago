import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'

// Auth is already enforced by middleware.ts for every /api/admin/* route --
// this only needs to know *who* is checking guests in, for checked_in_by.
export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json()
    if (!accessCode) {
      return NextResponse.json({ error: 'Missing access code' }, { status: 400 })
    }

    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    const supabase = createServiceClient()
    const { data: accessRequest, error: fetchError } = await supabase
      .from('xc_access_requests')
      .select('id, status, checked_in_at')
      .eq('app_id', APP_ID)
      .eq('access_code', accessCode)
      .maybeSingle()

    if (fetchError || !accessRequest) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    if (accessRequest.status !== 'approved') {
      return NextResponse.json({ error: 'This request was never approved' }, { status: 400 })
    }
    if (accessRequest.checked_in_at) {
      return NextResponse.json({ error: 'Already checked in', checkedInAt: accessRequest.checked_in_at }, { status: 409 })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('xc_access_requests')
      .update({ checked_in_at: now, checked_in_by: user?.email || null })
      .eq('id', accessRequest.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
    }

    return NextResponse.json({ success: true, checkedInAt: now })
  } catch (error) {
    console.error('[admin/checkin] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
