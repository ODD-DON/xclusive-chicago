import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

const TABLES: Record<string, string> = {
  vip: 'xc_vip_inquiries',
  experiences: 'xc_experience_inquiries',
}

export async function POST(request: NextRequest) {
  try {
    const { table, ids } = await request.json()

    if (!TABLES[table] || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from(TABLES[table])
      .update({ viewed_at: new Date().toISOString() })
      .eq('app_id', APP_ID)
      .in('id', ids)
      .is('viewed_at', null)

    if (error) {
      console.error('Mark-viewed error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
