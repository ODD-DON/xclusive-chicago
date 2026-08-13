import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passToken } = body

    if (!passToken) {
      return NextResponse.json({ error: 'Missing pass token' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get registration
    const { data: registration, error: fetchError } = await supabase
      .from('xc_registrations')
      .select('id, pass_opened_at')
      .eq('app_id', APP_ID)
      .eq('pass_token', passToken)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    // Only update if not already tracked
    if (!registration.pass_opened_at) {
      await supabase
        .from('xc_registrations')
        .update({ pass_opened_at: new Date().toISOString() })
        .eq('id', registration.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
