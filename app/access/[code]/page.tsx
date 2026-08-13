import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { AccessContent } from './access-content'

interface Props {
  params: Promise<{ code: string }>
}

export default async function AccessPage({ params }: Props) {
  const { code } = await params
  const supabase = createServiceClient()

  const { data: accessRequest, error } = await supabase
    .from('xc_access_requests')
    .select(`
      *,
      member:xc_members(*),
      event:xc_events(*, club:xc_clubs(*))
    `)
    .eq('access_code', code)
    .single()

  if (error || !accessRequest) {
    notFound()
  }

  return <AccessContent accessRequest={accessRequest} />
}
