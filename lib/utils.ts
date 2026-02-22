import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parse, addMinutes, isWithinInterval, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, 'h:mm a')
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMMM d, yyyy')
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = []
  const start = parse(startTime, 'HH:mm:ss', new Date())
  const end = parse(endTime, 'HH:mm:ss', new Date())

  let current = start
  while (addMinutes(current, durationMinutes) <= end) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, durationMinutes)
  }

  return slots
}

export function isSlotBooked(
  slot: string,
  date: string,
  bookings: Array<{ appointment_time: string; appointment_date: string; duration_minutes?: number }>
): boolean {
  return bookings.some((booking) => {
    if (booking.appointment_date !== date) return false
    return booking.appointment_time.startsWith(slot)
  })
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] ?? 'Unknown'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  return phone
}

export function canCancelBooking(appointmentDate: string, appointmentTime: string): boolean {
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)
  const now = new Date()
  const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilAppointment >= 24
}

export function getStarRating(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}
