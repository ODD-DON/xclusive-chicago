import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { GuestsContent } from './guests-content'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createServiceClient()

  const { data: accessRequests } = await supabase
    .from('xc_access_requests')
    .select(`
      *,
      member:xc_members(*),
      event:xc_events(id, title, event_date, image_url, club:xc_clubs(name, image_url))
    `)
    .eq('app_id', APP_ID)
    .order('requested_at', { ascending: false })

  const { data: members } = await supabase
    .from('xc_members')
    .select('*')
    .eq('app_id', APP_ID)
    .order('created_at', { ascending: false })

  return {
    accessRequests: accessRequests || [],
    members: members || [],
  }
}

export default async function AdminGuestsPage() {
  const data = await getData()
  return <GuestsContent {...data} />
}
