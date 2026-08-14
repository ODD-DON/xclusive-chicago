import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { EventDashboardContent } from './event-dashboard-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventDashboardPage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: event, error } = await supabase
    .from('xc_events')
    .select('*, club:xc_clubs(*)')
    .eq('id', id)
    .eq('app_id', APP_ID)
    .single()

  if (error || !event) {
    notFound()
  }

  const { data: accessRequests } = await supabase
    .from('xc_access_requests')
    .select('*, member:xc_members(*)')
    .eq('event_id', id)
    .order('requested_at', { ascending: false })

  return <EventDashboardContent event={event} accessRequests={accessRequests || []} />
}
