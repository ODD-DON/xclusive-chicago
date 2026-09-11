import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { CheckinContent } from './checkin-content'

interface Props {
  params: Promise<{ code: string; guest: string }>
}

export const dynamic = 'force-dynamic'

// Reached by scanning the QR code on one guest's ticket -- each guest in a
// party has their own ticket and their own [guest] number, so a scan only
// ever checks in that one person, never the whole group at once. Living
// under /admin means the existing admin auth wall (see middleware.ts) is
// what stops a guest from just scanning their own ticket and checking
// themselves in -- only someone logged in as staff can load this page.
export default async function AdminCheckinPage({ params }: Props) {
  const { code, guest } = await params
  const guestNumber = Number(guest)
  const supabase = createServiceClient()

  const { data: accessRequest } = await supabase
    .from('xc_access_requests')
    .select('*, member:xc_members(*), event:xc_events(*, club:xc_clubs(*))')
    .eq('app_id', APP_ID)
    .eq('access_code', code)
    .maybeSingle()

  return <CheckinContent accessRequest={accessRequest} guestNumber={guestNumber} />
}
