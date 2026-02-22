import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AvailabilityManager } from '@/components/barber/AvailabilityManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barberProfile } = await supabase
    .from('barber_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barberProfile) redirect('/barber/profile')

  const { data: availability } = await supabase
    .from('barber_availability')
    .select('*')
    .eq('barber_id', barberProfile.id)
    .order('day_of_week')

  // Upcoming bookings
  const today = new Date().toISOString().split('T')[0]
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      users!customer_id(full_name),
      services(name, duration_minutes)
    `)
    .eq('barber_id', barberProfile.id)
    .gte('appointment_date', today)
    .in('status', ['pending', 'confirmed'])
    .order('appointment_date')
    .order('appointment_time')
    .limit(20)

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule & Availability</h1>
        <p className="text-gray-500 mt-1">Manage your working hours and view upcoming bookings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Availability Manager */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Weekly Availability</h2>
          <AvailabilityManager
            barberId={barberProfile.id}
            initialAvailability={availability ?? []}
          />
        </div>

        {/* Upcoming Appointments */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{(booking as any).users?.full_name}</p>
                        <p className="text-sm text-gray-500">{(booking as any).services?.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(booking.appointment_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at {formatTime(booking.appointment_time)}
                        </p>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
              <p>No upcoming appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
