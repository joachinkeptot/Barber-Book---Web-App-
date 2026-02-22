import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatTime, formatPrice, canCancelBooking } from '@/lib/utils'
import { CancelBookingButton } from '@/components/customer/CancelBookingButton'
import { ReviewButton } from '@/components/customer/ReviewButton'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      barber_profiles!inner(
        id,
        profile_image_url,
        users!inner(full_name)
      ),
      services(name, duration_minutes)
    `)
    .eq('customer_id', user.id)
    .order('appointment_date', { ascending: false })

  const upcoming = bookings?.filter((b) =>
    ['pending', 'confirmed'].includes(b.status) &&
    new Date(`${b.appointment_date}T${b.appointment_time}`) >= new Date()
  ) ?? []

  const past = bookings?.filter((b) =>
    b.status === 'completed' ||
    (b.status !== 'cancelled' && new Date(`${b.appointment_date}T${b.appointment_time}`) < new Date())
  ) ?? []

  const cancelled = bookings?.filter((b) => b.status === 'cancelled') ?? []

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'Pending', variant: 'secondary', icon: AlertCircle },
    confirmed: { label: 'Confirmed', variant: 'default', icon: CheckCircle },
    completed: { label: 'Completed', variant: 'outline', icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  }

  function BookingCard({ booking }: { booking: any }) {
    const status = statusConfig[booking.status] ?? statusConfig.pending
    const StatusIcon = status.icon
    const canCancel = canCancelBooking(booking.appointment_date, booking.appointment_time)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold">{booking.barber_profiles?.users?.full_name}</h3>
              <p className="text-sm text-gray-500">{booking.services?.name}</p>
            </div>
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(booking.appointment_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(booking.appointment_time)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-orange-500">
                {formatPrice(booking.total_price)}
              </span>
              {booking.deposit_paid && (
                <span className="text-xs text-green-600 ml-2">Deposit paid</span>
              )}
            </div>
            <div className="flex gap-2">
              {booking.status === 'completed' && (
                <ReviewButton bookingId={booking.id} barberId={booking.barber_profiles?.id} />
              )}
              {['pending', 'confirmed'].includes(booking.status) && canCancel && (
                <CancelBookingButton bookingId={booking.id} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-gray-500 mt-1">Manage your appointments</p>
        </div>
        <Link href="/barbers">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Book New
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming appointments</p>
              <Link href="/barbers" className="mt-3 inline-block">
                <Button variant="outline" size="sm">Find a Barber</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length > 0 ? (
            <div className="space-y-4">
              {past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No past appointments</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelled.length > 0 ? (
            <div className="space-y-4">
              {cancelled.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <XCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No cancelled appointments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
