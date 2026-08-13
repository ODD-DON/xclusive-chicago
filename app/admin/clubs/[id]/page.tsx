import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ClubForm } from '../club-form'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClubPage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: club, error } = await supabase.from('xc_clubs').select('*').eq('id', id).single()

  if (error || !club) {
    notFound()
  }

  const { data: notesRow } = await supabase
    .from('xc_club_notes')
    .select('notes')
    .eq('club_id', id)
    .maybeSingle()

  return <ClubForm club={club} initialNotes={notesRow?.notes || ''} />
}
