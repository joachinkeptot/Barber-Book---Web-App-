import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, calculateDeposit } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      barberId,
      serviceId,
      customerId,
      appointmentDate,
      appointmentTime,
      totalPrice,
    } = await request.json()

    // Validate inputs
    if (!barberId || !serviceId || !appointmentDate || !appointmentTime || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for conflicting booking
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('barber_id', barberId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime + ':00')
      .in('status', ['pending', 'confirmed'])
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      )
    }

    // Get service details for Stripe
    const { data: service } = await supabase
      .from('services')
      .select('name, price')
      .eq('id', serviceId)
      .single()

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Get barber name
    const { data: barber } = await supabase
      .from('barber_profiles')
      .select('users!inner(full_name)')
      .eq('id', barberId)
      .single()

    const depositAmount = calculateDeposit(totalPrice)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${service.name} - Deposit`,
              description: `Appointment with ${(barber?.users as any)?.full_name} on ${appointmentDate} at ${appointmentTime}`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/bookings?success=true`,
      cancel_url: `${appUrl}/book?barberId=${barberId}&cancelled=true`,
      metadata: {
        barberId,
        serviceId,
        customerId,
        appointmentDate,
        appointmentTime,
        totalPrice: totalPrice.toString(),
      },
    })

    // Create a pending booking
    const { error: bookingError } = await supabase.from('bookings').insert({
      customer_id: customerId,
      barber_id: barberId,
      service_id: serviceId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime + ':00',
      status: 'pending',
      total_price: totalPrice,
      deposit_paid: false,
      stripe_payment_intent_id: session.payment_intent as string ?? session.id,
    })

    if (bookingError) {
      console.error('Booking insert error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
