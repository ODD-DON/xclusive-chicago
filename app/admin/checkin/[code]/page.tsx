import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { CheckinContent } from './checkin-content'

interface Props {
  params: Promise<{ code: string }>
}

export const dynamic = 'force-dynamic'

// Reached by scanning the QR code on a guest's ticket. Living under /admin
// means the existing admin auth wall (see middleware.ts) is what stops a
// guest from just scanning their own ticket and checking themselves in --
// only someone logged in as staff can load this page at all.
export default async function AdminCheckinPage({ params }: Props) {
  const { code } = await params
  const supabase = createServiceClient()

  const { data: accessRequest } = await supabase
    .from('xc_access_requests')
    .select('*, member:xc_members(*), event:xc_events(*, club:xc_clubs(*))')
    .eq('app_id', APP_ID)
    .eq('access_code', code)
    .maybeSingle()

  return <CheckinContent accessRequest={accessRequest} />
}
