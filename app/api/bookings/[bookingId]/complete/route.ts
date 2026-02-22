import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a barber and owns this booking
    const { data: barberProfile } = await supabase
      .from('barber_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!barberProfile) {
      return NextResponse.json({ error: 'Not a barber' }, { status: 403 })
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', params.bookingId)
      .eq('barber_id', barberProfile.id)
      .in('status', ['pending', 'confirmed'])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
