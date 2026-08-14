import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const supabase = createServiceClient()

    await supabase
      .from('xc_access_requests')
      .update({ rsvp_completed_at: new Date().toISOString() })
      .eq('access_code', code)
      .eq('app_id', APP_ID)
      .is('rsvp_completed_at', null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('RSVP tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
