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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find bookings that are 24 hours from now (with 30 min window)
    const now = new Date()
    const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const reminderDate = reminderTime.toISOString().split('T')[0]
    const reminderHour = reminderTime.getHours().toString().padStart(2, '0')
    const reminderMinute = reminderTime.getMinutes().toString().padStart(2, '0')

    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        users!customer_id(full_name, email, phone),
        barber_profiles!inner(
          users!inner(full_name)
        ),
        services(name)
      `)
      .eq('appointment_date', reminderDate)
      .eq('status', 'confirmed')
      .gte('appointment_time', `${reminderHour}:${reminderMinute}:00`)
      .lte('appointment_time', `${reminderHour}:59:59`)

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

    for (const booking of bookings) {
      const customerEmail = (booking as any).users?.email
      const customerPhone = (booking as any).users?.phone
      const customerName = (booking as any).users?.full_name
      const barberName = (booking as any).barber_profiles?.users?.full_name
      const serviceName = (booking as any).services?.name
      const appointmentTime = booking.appointment_time.slice(0, 5)
      const appointmentDate = new Date(booking.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })

      // Send email reminder via Resend
      if (customerEmail && resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BarberBook <reminders@barberbook.com>',
              to: customerEmail,
              subject: `Reminder: Your appointment tomorrow at ${appointmentTime}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #f97316;">Appointment Reminder</h2>
                  <p>Hi ${customerName},</p>
                  <p>This is a reminder that you have an appointment tomorrow:</p>
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Service:</strong> ${serviceName}</p>
                    <p><strong>Barber:</strong> ${barberName}</p>
                    <p><strong>Date:</strong> ${appointmentDate}</p>
                    <p><strong>Time:</strong> ${appointmentTime}</p>
                  </div>
                  <p>Remember: If you need to cancel, please do so at least 24 hours in advance for a full refund.</p>
                  <p>See you tomorrow!</p>
                  <p>- The BarberBook Team</p>
                </div>
              `,
            }),
          })
        } catch (emailError) {
          console.error('Email send error:', emailError)
        }
      }

      // Send SMS reminder via Twilio
      if (customerPhone && twilioSid && twilioToken && twilioPhone) {
        try {
          const message = `BarberBook Reminder: You have a ${serviceName} appointment with ${barberName} tomorrow at ${appointmentTime}. Need to cancel? Visit BarberBook 24hrs+ before for a refund.`

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
          const body = new URLSearchParams({
            From: twilioPhone,
            To: customerPhone,
            Body: message,
          })

          await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          })
        } catch (smsError) {
          console.error('SMS send error:', smsError)
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${bookings.length} reminders` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
