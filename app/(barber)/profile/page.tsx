import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/barber/ProfileEditor'

export default async function BarberProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: barberProfile } = await supabase
    .from('barber_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!barberProfile) redirect('/barber/dashboard')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-gray-500 mt-1">Update your public profile information</p>
      </div>
      <ProfileEditor
        user={userData!}
        barberProfile={barberProfile}
      />
    </div>
  )
}
