import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data, error } = await supabase
      .from('xc_clubs')
      .insert({
        app_id: APP_ID,
        name: body.name,
        slug,
        address: body.address,
        neighborhood: body.neighborhood || null,
        dress_code: body.dress_code || null,
        description: body.description,
        image_url: body.image_url,
        gallery_urls: body.gallery_urls || [],
        bottle_menu_urls: body.bottle_menu_urls || [],
        size: body.size || 'medium',
        music_styles: body.music_styles || [],
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create club error:', error)
      return NextResponse.json({ error: 'Failed to create club' }, { status: 500 })
    }

    if (body.admin_notes !== undefined) {
      await supabase
        .from('xc_club_notes')
        .upsert({ club_id: data.id, notes: body.admin_notes || null, updated_at: new Date().toISOString() })
    }

    return NextResponse.json({ success: true, club: data })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, admin_notes, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing club ID' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // If name is being updated, update slug too
    if (updates.name) {
      updates.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }

    // First verify the club exists and belongs to this app
    const { data: existingClub } = await supabase
      .from('xc_clubs')
      .select('id, app_id')
      .eq('id', id)
      .single()

    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('xc_clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update club error:', error)
      return NextResponse.json({ error: 'Failed to update club' }, { status: 500 })
    }

    if (admin_notes !== undefined) {
      await supabase
        .from('xc_club_notes')
        .upsert({ club_id: id, notes: admin_notes || null, updated_at: new Date().toISOString() })
    }

    return NextResponse.json({ success: true, club: data })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing club ID' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('xc_clubs')
      .delete()
      .eq('id', id)
      .eq('app_id', APP_ID)

    if (error) {
      console.error('[v0] Delete club error:', error)
      return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
