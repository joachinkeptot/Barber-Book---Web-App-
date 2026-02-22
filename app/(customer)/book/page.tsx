import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from '@/components/customer/BookingForm'

interface Props {
  searchParams: { barberId?: string; serviceId?: string }
}

export default async function BookPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/book?barberId=${searchParams.barberId}`)
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userData?.role === 'barber') {
    redirect('/barber/dashboard')
  }

  if (!searchParams.barberId) {
    redirect('/barbers')
  }

  const { data: barber } = await supabase
    .from('barber_profiles')
    .select(`
      *,
      users!inner(id, full_name),
      services(*, is_active),
      barber_availability(*)
    `)
    .eq('id', searchParams.barberId)
    .single()

  if (!barber) redirect('/barbers')

  const activeServices = barber.services?.filter((s: any) => s.is_active) ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Book Appointment</h1>
        <p className="text-gray-500 mt-1">with {barber.users.full_name}</p>
      </div>

      <BookingForm
        barber={barber as any}
        services={activeServices}
        availability={barber.barber_availability ?? []}
        preselectedServiceId={searchParams.serviceId}
        customerId={user.id}
      />
    </div>
  )
}
