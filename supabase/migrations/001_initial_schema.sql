-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('barber', 'customer');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE media_type AS ENUM ('image', 'video');

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BARBER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.barber_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  profile_image_url TEXT,
  instagram_handle TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- SERVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BARBER AVAILABILITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.barber_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_available BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(barber_id, day_of_week)
);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent double bookings
CREATE UNIQUE INDEX IF NOT EXISTS unique_barber_slot
  ON public.bookings (barber_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id) -- One review per booking
);

-- ============================================================
-- BARBER MEDIA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.barber_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type media_type NOT NULL DEFAULT 'image',
  service_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WAITLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time_range TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date ON public.bookings(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_barber ON public.reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_services_barber ON public.services(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_media_barber ON public.barber_media(barber_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_barber_date ON public.waitlist(barber_id, preferred_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS RLS POLICIES
-- ============================================================

-- Anyone can read user profiles (needed for barber lookup)
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- BARBER PROFILES RLS POLICIES
-- ============================================================

CREATE POLICY "Barber profiles are viewable by everyone"
  ON public.barber_profiles FOR SELECT
  USING (true);

CREATE POLICY "Barbers can insert own profile"
  ON public.barber_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'barber')
  );

CREATE POLICY "Barbers can update own profile"
  ON public.barber_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- SERVICES RLS POLICIES
-- ============================================================

CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Barbers can manage own services"
  ON public.services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.barber_profiles
      WHERE id = services.barber_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- BARBER AVAILABILITY RLS POLICIES
-- ============================================================

CREATE POLICY "Availability is viewable by everyone"
  ON public.barber_availability FOR SELECT
  USING (true);

CREATE POLICY "Barbers can manage own availability"
  ON public.barber_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.barber_profiles
      WHERE id = barber_availability.barber_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKINGS RLS POLICIES
-- ============================================================

CREATE POLICY "Customers can view own bookings"
  ON public.bookings FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.barber_profiles
      WHERE id = bookings.barber_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers and barbers can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.barber_profiles
      WHERE id = bookings.barber_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- REVIEWS RLS POLICIES
-- ============================================================

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews for completed bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = reviews.booking_id
        AND customer_id = auth.uid()
        AND status = 'completed'
    )
  );

-- ============================================================
-- BARBER MEDIA RLS POLICIES
-- ============================================================

CREATE POLICY "Barber media is viewable by everyone"
  ON public.barber_media FOR SELECT
  USING (true);

CREATE POLICY "Barbers can manage own media"
  ON public.barber_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.barber_profiles
      WHERE id = barber_media.barber_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- WAITLIST RLS POLICIES
-- ============================================================

CREATE POLICY "Customers can view own waitlist entries"
  ON public.waitlist FOR SELECT
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.barber_profiles
      WHERE id = waitlist.barber_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can remove themselves from waitlist"
  ON public.waitlist FOR DELETE
  USING (customer_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create barber-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('barber-media', 'barber-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to barber-media
CREATE POLICY "Barbers can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'barber-media' AND
    auth.role() = 'authenticated'
  );

-- Allow public read access to barber-media
CREATE POLICY "Media is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barber-media');

-- Allow barbers to delete their own media
CREATE POLICY "Barbers can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'barber-media' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- ============================================================
-- FUNCTION: Update barber rating
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_barber_rating(p_barber_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.barber_profiles
  SET
    rating = (
      SELECT COALESCE(AVG(rating::DECIMAL), 0)
      FROM public.reviews
      WHERE barber_id = p_barber_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE barber_id = p_barber_id
    )
  WHERE id = p_barber_id;
END;
$$;

-- Trigger to auto-update rating when a review is inserted
CREATE OR REPLACE FUNCTION public.trigger_update_barber_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_barber_rating(NEW.barber_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_barber_rating();
