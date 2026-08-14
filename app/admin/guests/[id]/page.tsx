import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { GuestProfileContent } from './guest-profile-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

// The route param is a phone number (digits only), not a table id -- the
// only identifier every lead source (guestlist, VIP, experiences) shares,
// since VIP/experience inquiries never link to an xc_members row.
export default async function GuestProfilePage({ params }: Props) {
  const { id } = await params
  const phone = decodeURIComponent(id).replace(/\D/g, '')
  const supabase = createServiceClient()

  const { data: member } = await supabase
    .from('xc_members')
    .select('*')
    .eq('phone', phone)
    .eq('app_id', APP_ID)
    .maybeSingle()

  const accessRequestsQuery = member
    ? supabase
        .from('xc_access_requests')
        .select('*, event:xc_events(id, title, event_date, club:xc_clubs(name))')
        .eq('member_id', member.id)
        .order('requested_at', { ascending: false })
    : null

  const [accessRequests, vipInquiries, experienceInquiries] = await Promise.all([
    accessRequestsQuery,
    supabase
      .from('xc_vip_inquiries')
      .select('*')
      .eq('phone', phone)
      .eq('app_id', APP_ID)
      .order('created_at', { ascending: false }),
    supabase
      .from('xc_experience_inquiries')
      .select('*')
      .eq('phone', phone)
      .eq('app_id', APP_ID)
      .order('created_at', { ascending: false }),
  ])

  const hasAnyData =
    !!member || (vipInquiries.data?.length || 0) > 0 || (experienceInquiries.data?.length || 0) > 0

  if (!hasAnyData) {
    notFound()
  }

  return (
    <GuestProfileContent
      phone={phone}
      member={member}
      accessRequests={accessRequests?.data || []}
      vipInquiries={vipInquiries.data || []}
      experienceInquiries={experienceInquiries.data || []}
    />
  )
}
