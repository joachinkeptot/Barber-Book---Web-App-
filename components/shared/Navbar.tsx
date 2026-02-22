'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Scissors, Menu, X, LogOut, User, Calendar, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import type { User as UserType } from '@/types/database.types'

interface NavbarProps {
  user?: UserType | null
  barberProfileImageUrl?: string | null
}

export function Navbar({ user, barberProfileImageUrl }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isBarber = user?.role === 'barber'

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Scissors className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-xl">BarberBook</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link href="/barbers">
                  <Button variant="ghost">Find Barbers</Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : isBarber ? (
              <>
                <Link href="/barber/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/barber/schedule">
                  <Button variant="ghost">Schedule</Button>
                </Link>
                <Link href="/barber/services">
                  <Button variant="ghost">Services</Button>
                </Link>
                <UserMenu
                  user={user}
                  imageUrl={barberProfileImageUrl}
                  onSignOut={handleSignOut}
                  isBarber
                />
              </>
            ) : (
              <>
                <Link href="/barbers">
                  <Button variant="ghost">Find Barbers</Button>
                </Link>
                <Link href="/bookings">
                  <Button variant="ghost">My Bookings</Button>
                </Link>
                <UserMenu
                  user={user}
                  imageUrl={null}
                  onSignOut={handleSignOut}
                  isBarber={false}
                />
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-2">
            {!user ? (
              <>
                <Link href="/barbers" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Find Barbers</Button>
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Log In</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : isBarber ? (
              <>
                <Link href="/barber/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                </Link>
                <Link href="/barber/schedule" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Schedule</Button>
                </Link>
                <Link href="/barber/services" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Services</Button>
                </Link>
                <Link href="/barber/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Profile</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/barbers" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Find Barbers</Button>
                </Link>
                <Link href="/bookings" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">My Bookings</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function UserMenu({
  user,
  imageUrl,
  onSignOut,
  isBarber,
}: {
  user: UserType
  imageUrl: string | null | undefined
  onSignOut: () => void
  isBarber: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          <Avatar className="h-8 w-8">
            {imageUrl && <AvatarImage src={imageUrl} alt={user.full_name} />}
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium">{user.full_name}</div>
        <div className="px-2 py-0.5 text-xs text-muted-foreground">{user.email}</div>
        <DropdownMenuSeparator />
        {isBarber ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/barber/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/barber/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/bookings" className="cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" />
                My Bookings
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-red-500 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
