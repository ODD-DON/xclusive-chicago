import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID, Club } from '@/lib/types'

export const dynamic = 'force-dynamic'
import { ClubsContent } from './clubs-content'

async function getClubs() {
  const supabase = createServiceClient()

  const { data: clubs, error } = await supabase
    .from('xc_clubs')
    .select('*')
    .eq('app_id', APP_ID)
    .order('name', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching clubs:', error)
    return []
  }

  return clubs as Club[]
}

export default async function ClubsPage() {
  const clubs = await getClubs()
  return <ClubsContent initialClubs={clubs} />
}
