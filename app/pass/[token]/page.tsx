import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'
import { notFound } from 'next/navigation'
import { PassContent } from './pass-content'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PassPage({ params }: Props) {
  const { token } = await params

  const supabase = createServiceClient()

  const { data: registration, error } = await supabase
    .from('xc_registrations')
    .select(`
      *,
      club:xc_clubs(*),
      event:xc_events(*)
    `)
    .eq('app_id', APP_ID)
    .eq('pass_token', token)
    .single()

  if (error || !registration) {
    notFound()
  }

  return <PassContent registration={registration} />
}
