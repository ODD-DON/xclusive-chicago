import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.event_date || !body.title) {
      return NextResponse.json({ error: 'Missing event date or name' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('xc_events')
      .insert({
        app_id: APP_ID,
        club_id: body.club_id || null,
        event_date: body.event_date,
        title: body.title,
        unlock_time: body.unlock_time || null,
        cutoff_time: body.cutoff_time || null,
        is_active: true,
        source_url: body.source_url || null,
        source_platform: body.source_platform || null,
        ticket_url: body.ticket_url || null,
        tables_url: body.tables_url || null,
        image_url: body.image_url || null,
        description: body.description || null,
        scraped_venue_name: body.scraped_venue_name || null,
        scraped_venue_address: body.scraped_venue_address || null,
        allocation: body.allocation ?? null,
        release_number: body.release_number || 1,
        approval_mode: body.approval_mode || 'auto',
        waitlist_enabled: !!body.waitlist_enabled,
        access_status_override: body.access_status_override || null,
        featured: !!body.featured,
        member_only: !!body.member_only,
        vip_only: !!body.vip_only,
        announcement_text: body.announcement_text || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Create event error:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ success: true, event: data })
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
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('xc_events')
      .update(updates)
      .eq('id', id)
      .eq('app_id', APP_ID)

    if (error) {
      console.error('[v0] Update event error:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
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
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('xc_events')
      .delete()
      .eq('id', id)
      .eq('app_id', APP_ID)

    if (error) {
      console.error('[v0] Delete event error:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
