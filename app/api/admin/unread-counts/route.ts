import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const [vip, experiences] = await Promise.all([
      supabase
        .from('xc_vip_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', APP_ID)
        .is('viewed_at', null),
      supabase
        .from('xc_experience_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', APP_ID)
        .is('viewed_at', null),
    ])

    return NextResponse.json({
      vip: vip.count || 0,
      experiences: experiences.count || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ vip: 0, experiences: 0 })
  }
}
