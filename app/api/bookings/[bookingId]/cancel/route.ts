import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.bookingId)
      .eq('customer_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking cannot be cancelled' }, { status: 400 })
    }

    // Check if eligible for refund (24+ hours notice)
    const appointmentDateTime = new Date(
      `${booking.appointment_date}T${booking.appointment_time}`
    )
    const now = new Date()
    const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const eligibleForRefund = hoursUntil >= 24

    let refunded = false

    // Process refund if eligible and deposit was paid
    if (eligibleForRefund && booking.deposit_paid && booking.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id
        )

        if (paymentIntent.latest_charge) {
          await stripe.refunds.create({
            charge: paymentIntent.latest_charge as string,
          })
          refunded = true
        }
      } catch (stripeError) {
        console.error('Refund error:', stripeError)
      }
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', params.bookingId)

    // Check waitlist and notify
    const { data: waitlistEntries } = await supabase
      .from('waitlist')
      .select('*, users!customer_id(email, full_name)')
      .eq('barber_id', booking.barber_id)
      .eq('preferred_date', booking.appointment_date)
      .eq('notified', false)
      .limit(1)

    if (waitlistEntries && waitlistEntries.length > 0) {
      // Notify waitlist via Edge Function
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/waitlist-notify`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              waitlistEntry: waitlistEntries[0],
              availableDate: booking.appointment_date,
              availableTime: booking.appointment_time,
            }),
          }
        )
      } catch (e) {
        console.error('Waitlist notify error:', e)
      }
    }

    return NextResponse.json({ success: true, refunded })
  } catch (error: any) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
