import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { BacheloretteContent } from './bachelorette-content'

export const dynamic = 'force-dynamic'

async function getBacheloretteAccessRequests() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('xc_access_requests')
    .select(`
      *,
      member:xc_members(*),
      event:xc_events(id, title, event_date, club:xc_clubs(name))
    `)
    .eq('app_id', APP_ID)
    .eq('celebration_type', 'Bachelorette')
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('Error fetching bachelorette access requests:', error)
    return []
  }

  return data || []
}

async function getBacheloretteVipInquiries() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('xc_vip_inquiries')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('celebration_type', 'Bachelorette')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bachelorette VIP inquiries:', error)
    return []
  }

  return data || []
}

// Party Bus / Boat Day don't have their own celebration_type column -- the
// occasion question lands in the generic `details` jsonb, so filter on that.
async function getBacheloretteExperienceInquiries() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('xc_experience_inquiries')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('details->>celebrationType', 'Bachelorette')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bachelorette experience inquiries:', error)
    return []
  }

  return data || []
}

export default async function BacheloretteAdminPage() {
  const [accessRequests, vipInquiries, experienceInquiries] = await Promise.all([
    getBacheloretteAccessRequests(),
    getBacheloretteVipInquiries(),
    getBacheloretteExperienceInquiries(),
  ])

  return (
    <BacheloretteContent
      accessRequests={accessRequests}
      vipInquiries={vipInquiries}
      experienceInquiries={experienceInquiries}
    />
  )
}
