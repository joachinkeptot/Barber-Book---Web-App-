import Link from 'next/link'
import { Scissors } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col">
      <div className="p-4">
        <Link href="/" className="flex items-center space-x-2 w-fit">
          <Scissors className="h-6 w-6 text-orange-500" />
          <span className="font-bold text-xl">BarberBook</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
