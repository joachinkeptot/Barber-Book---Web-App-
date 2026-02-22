import Link from 'next/link'
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function BookingSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-6">
            Your deposit has been paid and your appointment is confirmed. You&apos;ll receive a
            confirmation email shortly, and a reminder 24 hours before your appointment.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/bookings">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                View My Bookings
              </Button>
            </Link>
            <Link href="/barbers">
              <Button variant="outline" className="w-full">
                Browse More Barbers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
