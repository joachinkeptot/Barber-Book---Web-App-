import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'
import { BarberCard } from '@/components/customer/BarberCard'
import { Input } from '@/components/ui/input'

export const revalidate = 60 // ISR - revalidate every 60 seconds

export default async function BarbersPage() {
  const supabase = await createClient()

  const { data: barbers } = await supabase
    .from('barber_profiles')
    .select(`
      *,
      users!inner(id, full_name, email),
      services(id, name, price, duration_minutes, is_active),
      barber_media(id, media_url, media_type)
    `)
    .order('rating', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Barber</h1>
        <p className="text-gray-600">Browse top-rated barbers in your area</p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search barbers..."
          className="pl-10"
        />
      </div>

      {/* Barbers Grid */}
      {barbers && barbers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <BarberCard key={barber.id} barber={barber as any} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No barbers found yet.</p>
          <p className="text-gray-400 mt-2">Check back soon!</p>
        </div>
      )}
    </div>
  )
}
