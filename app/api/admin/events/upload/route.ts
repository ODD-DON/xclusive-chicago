import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Reuses the "club-images" storage bucket (never event-specific by name --
// it's just where admin-uploaded venue/event imagery lives) rather than
// provisioning a new bucket and its access policies for this alone.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const ext = file.name.split('.').pop()
    const filename = `event-${eventId || 'new'}-${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('club-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('[events/upload] Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('club-images').getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('[events/upload] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
