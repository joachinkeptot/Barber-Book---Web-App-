import Link from 'next/link'
import Image from 'next/image'
import { Scissors, Calendar, Star, Shield, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Scissors className="h-6 w-6 text-orange-500" />
              <span className="font-bold text-xl">BarberBook</span>
            </Link>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Book Your Perfect Cut{' '}
                <span className="text-orange-500">Instantly</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Connect with top barbers in your area. Browse portfolios, check availability,
                and book your appointment in minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/barbers">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-lg px-8"
                  >
                    Find a Barber
                  </Button>
                </Link>
                <Link href="/signup?role=barber">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-lg px-8 border-orange-500 text-orange-500 hover:bg-orange-50"
                  >
                    I&apos;m a Barber
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span>4.9/5 average rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>10,000+ bookings</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-orange-500 rounded-3xl transform rotate-3" />
              <div className="relative bg-gray-900 rounded-3xl overflow-hidden aspect-[4/3]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Scissors className="h-24 w-24 mx-auto text-orange-500 mb-4" />
                    <p className="text-2xl font-bold">Premium Barbershop</p>
                    <p className="text-gray-400">Booking Platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose BarberBook?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Real-Time Availability',
                description:
                  'See live availability and book instantly. No more phone tag or waiting.',
              },
              {
                icon: Shield,
                title: 'Secure Payments',
                description:
                  'Pay your deposit securely through Stripe. Transparent refund policy.',
              },
              {
                icon: Star,
                title: 'Verified Reviews',
                description:
                  'Read authentic reviews from real customers. Trust the ratings.',
              },
              {
                icon: Clock,
                title: 'Smart Reminders',
                description:
                  'Get SMS and email reminders 24 hours before your appointment.',
              },
              {
                icon: CreditCard,
                title: 'Deposit System',
                description:
                  'Secure your spot with just a 50% deposit. Pay the rest at the shop.',
              },
              {
                icon: Scissors,
                title: 'Portfolio Gallery',
                description:
                  'Browse barber portfolios with photos and videos before booking.',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors">
                <feature.icon className="h-10 w-10 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to get your perfect cut?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of customers who book their appointments through BarberBook.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Scissors className="h-5 w-5 text-orange-500" />
            <span className="font-bold">BarberBook</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BarberBook. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
