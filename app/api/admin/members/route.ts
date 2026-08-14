import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { APP_ID } from '@/lib/types'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, first_name, last_name, phone, email, instagram } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing member id' }, { status: 400 })
    }
    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const cleanPhone = String(phone).replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('xc_members')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: cleanPhone,
        email: email?.trim() || null,
        instagram: instagram?.trim().replace(/^@/, '') || null,
      })
      .eq('id', id)
      .eq('app_id', APP_ID)
      .select()
      .single()

    if (error) {
      console.error('Update member error:', error)
      return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
    }

    return NextResponse.json({ success: true, member: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing member id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { count } = await supabase
      .from('xc_access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete a guest with ${count} access request${count === 1 ? '' : 's'}` },
        { status: 400 },
      )
    }

    const { error } = await supabase.from('xc_members').delete().eq('id', id).eq('app_id', APP_ID)

    if (error) {
      console.error('Delete member error:', error)
      return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
