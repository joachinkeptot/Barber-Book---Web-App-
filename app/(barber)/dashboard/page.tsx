import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, DollarSign, Star, Users, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'
import { MarkCompletedButton } from '@/components/barber/MarkCompletedButton'

export default async function BarberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barberProfile } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!barberProfile) redirect('/barber/profile')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  // Get today's appointments
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      users!customer_id(full_name, phone),
      services(name, duration_minutes)
    `)
    .eq('barber_id', barberProfile.id)
    .eq('appointment_date', today)
    .in('status', ['pending', 'confirmed'])
    .order('appointment_time')

  // Get upcoming appointments (next 7 days excluding today)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      users!customer_id(full_name),
      services(name)
    `)
    .eq('barber_id', barberProfile.id)
    .gt('appointment_date', today)
    .lte('appointment_date', nextWeek.toISOString().split('T')[0])
    .in('status', ['pending', 'confirmed'])
    .order('appointment_date')
    .order('appointment_time')

  // Monthly earnings
  const { data: monthlyBookings } = await supabase
    .from('bookings')
    .select('total_price, deposit_paid')
    .eq('barber_id', barberProfile.id)
    .gte('appointment_date', firstOfMonth)
    .eq('status', 'completed')

  const monthlyEarnings = monthlyBookings?.reduce((sum, b) => sum + b.total_price, 0) ?? 0
  const totalBookingsThisMonth = monthlyBookings?.length ?? 0

  const statusBadge: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'secondary',
    confirmed: 'default',
    completed: 'outline',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold">{todayBookings?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">{formatPrice(monthlyEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bookings</p>
                <p className="text-2xl font-bold">{totalBookingsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-2xl font-bold">{barberProfile.rating?.toFixed(1) ?? '0.0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Today&apos;s Appointments</CardTitle>
            <Link href="/barber/schedule">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayBookings && todayBookings.length > 0 ? (
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-center min-w-[3rem]">
                        <div className="text-xs text-gray-400">
                          {formatTime(booking.appointment_time)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{(booking as any).users?.full_name}</p>
                        <p className="text-xs text-gray-500">{(booking as any).services?.name}</p>
                        {(booking as any).users?.phone && (
                          <p className="text-xs text-gray-400">{(booking as any).users.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-orange-500">
                        {formatPrice(booking.total_price)}
                      </span>
                      <Badge variant={statusBadge[booking.status] ?? 'secondary'} className="text-xs">
                        {booking.status}
                      </Badge>
                      <MarkCompletedButton bookingId={booking.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Upcoming (7 days)</CardTitle>
            <Link href="/barber/schedule">
              <Button variant="ghost" size="sm">View Schedule</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{(booking as any).users?.full_name}</p>
                      <p className="text-xs text-gray-500">{(booking as any).services?.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(booking.appointment_date)} at {formatTime(booking.appointment_time)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-orange-500">
                      {formatPrice(booking.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Edit Profile', href: '/barber/profile', icon: '👤' },
          { label: 'Manage Services', href: '/barber/services', icon: '✂️' },
          { label: 'Set Availability', href: '/barber/schedule', icon: '📅' },
          { label: 'View Reviews', href: `/barbers/${barberProfile.id}`, icon: '⭐' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer text-center">
              <CardContent className="p-4">
                <div className="text-2xl mb-1">{action.icon}</div>
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
