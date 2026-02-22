import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const { metadata } = session

      if (!metadata) break

      const { barberId, serviceId, customerId, appointmentDate, appointmentTime, totalPrice } =
        metadata

      // Update booking to confirmed and mark deposit paid
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          deposit_paid: true,
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('customer_id', customerId)
        .eq('barber_id', barberId)
        .eq('appointment_date', appointmentDate)
        .eq('appointment_time', appointmentTime + ':00')
        .eq('status', 'pending')

      if (error) {
        console.error('Error updating booking:', error)
      }

      // Trigger reminder scheduling via Supabase Edge Function
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-reminders`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId,
              barberId,
              appointmentDate,
              appointmentTime,
              serviceName: 'Your appointment', // Could fetch from DB
            }),
          }
        )
      } catch (reminderError) {
        console.error('Failed to schedule reminder:', reminderError)
      }

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Cancel any pending bookings with this payment intent
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .eq('status', 'pending')

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Required: disable body parsing for webhook signature verification
export const runtime = 'nodejs'
