import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'barber') redirect('/')

  const { data: barberProfile } = await supabase
    .from('barber_profiles')
    .select('profile_image_url')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userData} barberProfileImageUrl={barberProfile?.profile_image_url} />
      <main className="pt-16">{children}</main>
    </div>
  )
}
