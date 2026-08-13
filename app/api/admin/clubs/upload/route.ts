import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const clubId = formData.get('clubId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${clubId || 'new'}-${Date.now()}.${ext}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('club-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('[v0] Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('club-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('[v0] Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
