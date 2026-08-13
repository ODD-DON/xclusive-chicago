import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('xc_events')
      .insert({
        app_id: APP_ID,
        club_id: body.club_id,
        event_date: body.event_date,
        unlock_time: body.unlock_time,
        cutoff_time: body.cutoff_time,
        is_active: true,
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
