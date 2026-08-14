import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID, Club } from '@/lib/types'
import { PartyBusContent } from './party-bus-content'

export const dynamic = 'force-dynamic'

async function getClubs() {
  const supabase = createServiceClient()

  const { data: clubs, error } = await supabase
    .from('xc_clubs')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching clubs:', error)
    return []
  }

  return clubs as Club[]
}

export default async function PartyBusPage() {
  const clubs = await getClubs()
  return <PartyBusContent clubs={clubs} />
}
