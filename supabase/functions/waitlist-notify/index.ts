import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { waitlistEntry, availableDate, availableTime } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    // Get customer details
    const { data: customer } = await supabase
      .from('users')
      .select('email, full_name, phone')
      .eq('id', waitlistEntry.customer_id)
      .single()

    // Get barber details
    const { data: barber } = await supabase
      .from('barber_profiles')
      .select('users!inner(full_name)')
      .eq('id', waitlistEntry.barber_id)
      .single()

    if (customer?.email && resendApiKey) {
      const barberName = (barber?.users as any)?.full_name
      const formattedDate = new Date(availableDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      const formattedTime = availableTime.slice(0, 5)
      const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://barberbook.com'

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BarberBook <notifications@barberbook.com>',
          to: customer.email,
          subject: `A slot just opened up with ${barberName}!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f97316;">Good News! A Slot Just Opened Up</h2>
              <p>Hi ${customer.full_name},</p>
              <p>A time slot you've been waiting for just became available:</p>
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Barber:</strong> ${barberName}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formattedTime}</p>
              </div>
              <p>Book it now before someone else does!</p>
              <a href="${appUrl}/book?barberId=${waitlistEntry.barber_id}"
                 style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 8px;">
                Book Now
              </a>
              <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">
                If you no longer need this slot, you can ignore this email.
              </p>
            </div>
          `,
        }),
      })
    }

    // Mark as notified
    await supabase
      .from('waitlist')
      .update({ notified: true })
      .eq('id', waitlistEntry.id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
