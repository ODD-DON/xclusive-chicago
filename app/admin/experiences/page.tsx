import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { ExperiencesContent } from './experiences-content'

export const dynamic = 'force-dynamic'

async function getInquiries() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('xc_experience_inquiries')
    .select('*')
    .eq('app_id', APP_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching experience inquiries:', error)
    return []
  }

  return data || []
}

export default async function ExperiencesPage() {
  const inquiries = await getInquiries()
  return <ExperiencesContent inquiries={inquiries} />
}
