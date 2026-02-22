import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userData = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    userData = data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userData} />
      <main className="pt-16">{children}</main>
    </div>
  )
}
