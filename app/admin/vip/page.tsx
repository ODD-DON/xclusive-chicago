import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { VipContent } from './vip-content'

export const dynamic = 'force-dynamic'

async function getVipRequests() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('xc_vip_requests')
    .select(`
      *,
      event:xc_events(
        event_date,
        club:xc_clubs(name)
      )
    `)
    .eq('app_id', APP_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching VIP requests:', error)
    return []
  }

  return data || []
}

export default async function VipPage() {
  const requests = await getVipRequests()
  return <VipContent requests={requests} />
}
