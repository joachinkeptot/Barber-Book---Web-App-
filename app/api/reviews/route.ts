import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, barberId, rating, comment } = await request.json()

    if (!bookingId || !barberId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Verify booking belongs to user and is completed
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .eq('status', 'completed')
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not completed' }, { status: 404 })
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'Already reviewed this booking' }, { status: 409 })
    }

    // Insert review
    const { error: reviewError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      customer_id: user.id,
      barber_id: barberId,
      rating,
      comment: comment || null,
    })

    if (reviewError) throw reviewError

    // Update barber rating via Edge Function
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-ratings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ barberId }),
        }
      )
    } catch (e) {
      // Non-critical: will be updated eventually
      console.error('Failed to update rating:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Review error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
