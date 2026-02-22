export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'barber' | 'customer'
          full_name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'barber' | 'customer'
          full_name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'barber' | 'customer'
          full_name?: string
          phone?: string | null
          created_at?: string
        }
      }
      barber_profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          profile_image_url: string | null
          instagram_handle: string | null
          rating: number
          total_reviews: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          profile_image_url?: string | null
          instagram_handle?: string | null
          rating?: number
          total_reviews?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          profile_image_url?: string | null
          instagram_handle?: string | null
          rating?: number
          total_reviews?: number
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          barber_id: string
          name: string
          description: string | null
          price: number
          duration_minutes: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          name: string
          description?: string | null
          price: number
          duration_minutes: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          name?: string
          description?: string | null
          price?: number
          duration_minutes?: number
          is_active?: boolean
          created_at?: string
        }
      }
      barber_availability: {
        Row: {
          id: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
        }
        Insert: {
          id?: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
        }
        Update: {
          id?: string
          barber_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          barber_id: string
          service_id: string
          appointment_date: string
          appointment_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          total_price: number
          deposit_paid: boolean
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          barber_id: string
          service_id: string
          appointment_date: string
          appointment_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          total_price: number
          deposit_paid?: boolean
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          barber_id?: string
          service_id?: string
          appointment_date?: string
          appointment_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          total_price?: number
          deposit_paid?: boolean
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          barber_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          customer_id: string
          barber_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          customer_id?: string
          barber_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      barber_media: {
        Row: {
          id: string
          barber_id: string
          media_url: string
          media_type: 'image' | 'video'
          service_tag: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          media_url: string
          media_type: 'image' | 'video'
          service_tag?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          media_url?: string
          media_type?: 'image' | 'video'
          service_tag?: string | null
          created_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          customer_id: string
          barber_id: string
          preferred_date: string
          preferred_time_range: string
          notified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          barber_id: string
          preferred_date: string
          preferred_time_range: string
          notified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          barber_id?: string
          preferred_date?: string
          preferred_time_range?: string
          notified?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'barber' | 'customer'
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      media_type: 'image' | 'video'
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type BarberProfile = Database['public']['Tables']['barber_profiles']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type BarberAvailability = Database['public']['Tables']['barber_availability']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type BarberMedia = Database['public']['Tables']['barber_media']['Row']
export type Waitlist = Database['public']['Tables']['waitlist']['Row']

// Extended types with joins
export type BarberWithProfile = User & {
  barber_profiles: BarberProfile & {
    services: Service[]
    barber_media: BarberMedia[]
  }
}

export type BookingWithDetails = Booking & {
  users: User
  barber_profiles: BarberProfile & { users: User }
  services: Service
}
