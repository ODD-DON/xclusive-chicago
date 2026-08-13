import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

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
        description: body.description,
        lat: body.lat,
        lng: body.lng,
        geofence_miles: body.geofence_miles || 0.5,
        default_unlock_time: body.default_unlock_time,
        default_cutoff_time: body.default_cutoff_time,
        recurring_days: body.recurring_days,
        image_url: body.image_url,
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

    // Auto-generate events for the next 2 weeks (Thu-Sat)
    if (data && body.recurring_days && body.recurring_days.length > 0) {
      const today = new Date()
      const twoWeeksOut = new Date(today)
      twoWeeksOut.setDate(today.getDate() + 14)

      const eventsToCreate = []
      const currentDate = new Date(today)
      
      while (currentDate <= twoWeeksOut) {
        const dayOfWeek = currentDate.getDay() // 0=Sun, 4=Thu, 5=Fri, 6=Sat
        
        // Only create events for Thu (4), Fri (5), Sat (6) if they're in recurring_days
        if (body.recurring_days.includes(dayOfWeek) && [4, 5, 6].includes(dayOfWeek)) {
          eventsToCreate.push({
            app_id: APP_ID,
            club_id: data.id,
            event_date: currentDate.toISOString().split('T')[0],
            unlock_time: body.default_unlock_time || '18:00:00',
            cutoff_time: body.default_cutoff_time || '23:59:00',
            is_active: true,
            guestlist_status: 'confirmed',
          })
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (eventsToCreate.length > 0) {
        const { error: eventsError } = await supabase
          .from('xc_events')
          .insert(eventsToCreate)

        if (eventsError) {
          console.error('[v0] Auto-generate events error:', eventsError)
          // Don't fail the club creation, just log the error
        }
      }
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing club ID' }, { status: 400 })
    }

    const supabase = await createClient()

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

    const supabase = await createClient()

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
