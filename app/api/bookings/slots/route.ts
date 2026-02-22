import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barberId = searchParams.get('barberId')
  const date = searchParams.get('date')

  if (!barberId || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('appointment_time')
    .eq('barber_id', barberId)
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed'])

  const bookedSlots = bookings?.map((b) => b.appointment_time) ?? []

  return NextResponse.json({ bookedSlots })
}
