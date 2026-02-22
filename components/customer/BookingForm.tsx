'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, isBefore, startOfToday } from 'date-fns'
import { Calendar, Clock, CreditCard, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { generateTimeSlots, formatTime, formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Service, BarberAvailability, BarberProfile } from '@/types/database.types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BookingFormProps {
  barber: BarberProfile & { users: { full_name: string } }
  services: Service[]
  availability: BarberAvailability[]
  preselectedServiceId?: string
  customerId: string
}

export function BookingForm({
  barber,
  services,
  availability,
  preselectedServiceId,
  customerId,
}: BookingFormProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(
    preselectedServiceId ? services.find((s) => s.id === preselectedServiceId) ?? null : null
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const { toast } = useToast()
  const router = useRouter()

  // Generate next 30 days
  const today = startOfToday()
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(today, i + 1)).filter(
    (date) => {
      const dayOfWeek = date.getDay()
      return availability.some(
        (a) => a.day_of_week === dayOfWeek && a.is_available
      )
    }
  )

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots()
    }
  }, [selectedDate, selectedService])

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return

    const dayOfWeek = selectedDate.getDay()
    const dayAvailability = availability.find(
      (a) => a.day_of_week === dayOfWeek && a.is_available
    )

    if (!dayAvailability) {
      setAvailableSlots([])
      return
    }

    const slots = generateTimeSlots(
      dayAvailability.start_time,
      dayAvailability.end_time,
      selectedService.duration_minutes
    )

    // Fetch booked slots for this day
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const response = await fetch(
      `/api/bookings/slots?barberId=${barber.id}&date=${dateStr}`
    )
    const data = await response.json()
    setBookedSlots(data.bookedSlots ?? [])
    setAvailableSlots(slots)
  }

  const isSlotTaken = (slot: string) => {
    return bookedSlots.some((booked) => booked.startsWith(slot))
  }

  const handleProceed = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        title: 'Please select all required fields',
        description: 'Choose a service, date, and time to continue.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      // Create booking and get Stripe session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: barber.id,
          serviceId: selectedService.id,
          customerId,
          appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
          appointmentTime: selectedTime,
          totalPrice: selectedService.price,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      if (stripeError) throw stripeError
    } catch (err: any) {
      toast({
        title: 'Booking failed',
        description: err.message ?? 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const depositAmount = selectedService ? selectedService.price * 0.5 : 0

  return (
    <div className="space-y-6">
      {/* Step 1: Select Service */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs">1</span>
            Select Service
          </h2>
          <div className="space-y-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service)
                  setSelectedTime(null)
                }}
                className={cn(
                  'w-full flex justify-between items-center p-3 rounded-lg border-2 text-left transition-all',
                  selectedService?.id === service.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration_minutes} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-500">{formatPrice(service.price)}</div>
                  <div className="text-xs text-gray-400">Deposit: {formatPrice(service.price * 0.5)}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Select Date */}
      {selectedService && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs">2</span>
              Select Date
            </h2>
            {availableDates.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date)
                      setSelectedTime(null)
                    }}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-lg border-2 text-sm transition-all',
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <span className="text-xs text-gray-400 uppercase">
                      {format(date, 'EEE')}
                    </span>
                    <span className="font-semibold">{format(date, 'd')}</span>
                    <span className="text-xs">{format(date, 'MMM')}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No available dates in the next 30 days.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Time */}
      {selectedDate && selectedService && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs">3</span>
              Select Time
            </h2>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const taken = isSlotTaken(slot)
                  return (
                    <button
                      key={slot}
                      onClick={() => !taken && setSelectedTime(slot)}
                      disabled={taken}
                      className={cn(
                        'p-2 rounded-lg border-2 text-sm font-medium transition-all',
                        taken
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                          : selectedTime === slot
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-100 hover:border-orange-300 hover:bg-orange-50'
                      )}
                    >
                      {formatTime(slot + ':00')}
                      {taken && <span className="block text-xs">Booked</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No available time slots for this date.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary & Payment */}
      {selectedService && selectedDate && selectedTime && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Booking Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{formatTime(selectedTime + ':00')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{selectedService.duration_minutes} min</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Price</span>
                  <span className="font-medium">{formatPrice(selectedService.price)}</span>
                </div>
                <div className="flex justify-between text-orange-600 font-bold">
                  <span>Deposit Due Now (50%)</span>
                  <span>{formatPrice(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs mt-1">
                  <span>Remaining at appointment</span>
                  <span>{formatPrice(selectedService.price - depositAmount)}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleProceed}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Pay Deposit {formatPrice(depositAmount)}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Secure payment via Stripe. Full refund if cancelled 24+ hours before.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
