import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServiceManager } from '@/components/barber/ServiceManager'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barberProfile } = await supabase
    .from('barber_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barberProfile) redirect('/barber/profile')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('barber_id', barberProfile.id)
    .order('created_at')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Services</h1>
        <p className="text-gray-500 mt-1">Add and manage the services you offer</p>
      </div>
      <ServiceManager barberId={barberProfile.id} initialServices={services ?? []} />
    </div>
  )
}
