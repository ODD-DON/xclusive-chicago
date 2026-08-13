import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { GuestProfileContent } from './guest-profile-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GuestProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: member, error } = await supabase
    .from('xc_members')
    .select('*')
    .eq('id', id)
    .eq('app_id', APP_ID)
    .single()

  if (error || !member) {
    notFound()
  }

  const { data: accessRequests } = await supabase
    .from('xc_access_requests')
    .select(`
      *,
      event:xc_events(id, title, event_date, club:xc_clubs(name))
    `)
    .eq('member_id', id)
    .order('requested_at', { ascending: false })

  return <GuestProfileContent member={member} accessRequests={accessRequests || []} />
}
