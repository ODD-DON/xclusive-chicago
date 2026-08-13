import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'
import { redirect } from 'next/navigation'
import { ConfirmationContent } from './confirmation-content'

interface Props {
  searchParams: Promise<{ token?: string; friends?: string }>
}

export default async function ConfirmedPage({ searchParams }: Props) {
  const params = await searchParams
  const token = params.token
  const friendCount = params.friends ? parseInt(params.friends, 10) : 0

  if (!token) {
    redirect('/guestlist')
  }

  const supabase = await createClient()

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
    redirect('/guestlist')
  }

  return <ConfirmationContent registration={registration} friendCount={friendCount} />
}
