'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Scissors, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') === 'barber' ? 'barber' : 'customer'
  const [role, setRole] = useState<'customer' | 'barber'>(defaultRole)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role,
          },
        },
      })

      if (authError) {
        toast({
          title: 'Sign up failed',
          description: authError.message,
          variant: 'destructive',
        })
        return
      }

      if (authData.user) {
        // Create user record
        const { error: userError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          role,
          phone: data.phone || null,
        })

        if (userError) {
          console.error('User record error:', userError)
        }

        // If barber, create barber profile
        if (role === 'barber') {
          const { error: profileError } = await supabase.from('barber_profiles').insert({
            user_id: authData.user.id,
            rating: 0,
            total_reviews: 0,
          })

          if (profileError) {
            console.error('Barber profile error:', profileError)
          }
        }

        toast({
          title: 'Account created!',
          description: 'Welcome to BarberBook.',
        })

        if (role === 'barber') {
          router.push('/barber/dashboard')
        } else {
          router.push('/barbers')
        }
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Join BarberBook today</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={cn(
              'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
              role === 'customer'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <User className={cn('h-8 w-8 mb-2', role === 'customer' ? 'text-orange-500' : 'text-gray-400')} />
            <span className={cn('font-medium text-sm', role === 'customer' ? 'text-orange-600' : 'text-gray-600')}>
              Customer
            </span>
            <span className="text-xs text-gray-400 mt-1">Book appointments</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('barber')}
            className={cn(
              'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
              role === 'barber'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Scissors className={cn('h-8 w-8 mb-2', role === 'barber' ? 'text-orange-500' : 'text-gray-400')} />
            <span className={cn('font-medium text-sm', role === 'barber' ? 'text-orange-600' : 'text-gray-600')}>
              Barber
            </span>
            <span className="text-xs text-gray-400 mt-1">Manage bookings</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register('phone')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm">
        <p className="text-muted-foreground w-full">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-500 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
