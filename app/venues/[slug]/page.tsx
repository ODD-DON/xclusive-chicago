import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID, Event } from '@/lib/types'
import { chicagoTodayStr } from '@/lib/date'
import { notFound } from 'next/navigation'
import { VenueContent } from './venue-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: club, error } = await supabase
    .from('xc_clubs')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !club) {
    notFound()
  }

  const todayStr = chicagoTodayStr()

  const { data: events } = await supabase
    .from('xc_events')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('club_id', club.id)
    .eq('is_active', true)
    .gte('event_date', todayStr)
    .order('event_date', { ascending: true })

  const eventIds = (events || []).map((e) => e.id)
  const approvedCounts: Record<string, number> = {}

  if (eventIds.length > 0) {
    const { data: approved } = await supabase
      .from('xc_access_requests')
      .select('event_id')
      .eq('app_id', APP_ID)
      .eq('status', 'approved')
      .in('event_id', eventIds)

    approved?.forEach((r) => {
      approvedCounts[r.event_id] = (approvedCounts[r.event_id] || 0) + 1
    })
  }

  return (
    <VenueContent
      club={club}
      events={(events || []) as Event[]}
      approvedCounts={approvedCounts}
    />
  )
}
