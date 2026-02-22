# BarberBook — Barbershop Booking Web Application

A full-stack barbershop booking platform built with Next.js 14, Supabase, Stripe, and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe Checkout with deposit system
- **Styling**: Tailwind CSS + Radix UI
- **Deployment**: Vercel

---

## Features

### Customer Side
- Browse barber profiles with photos/videos
- View real-time availability on a date picker
- Select service + time slot
- Pay 50% deposit via Stripe Checkout
- Receive email & SMS reminders 24h before appointment
- View and manage bookings
- Leave star ratings + reviews after completed appointments
- Cancel with full deposit refund (24h+ notice)
- Join waitlist for preferred times

### Barber Side
- Create/edit profile (bio, photos, Instagram)
- Manage services (add/edit/delete with prices and duration)
- Set weekly availability schedule
- Dashboard with today's appointments and monthly stats
- Mark appointments as completed
- Upload portfolio photos/videos to Supabase Storage
- Waitlist management with auto-notifications

---

## Project Structure

```
/app
  /api
    /stripe
      /webhook/route.ts        ← Stripe webhook handler
      /checkout/route.ts       ← Create Stripe checkout session
    /bookings
      /slots/route.ts          ← Get available time slots
      /[bookingId]
        /cancel/route.ts       ← Cancel booking + refund
        /complete/route.ts     ← Mark booking complete
    /reviews/route.ts          ← Submit reviews
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(customer)
    /barbers/page.tsx          ← Browse barbers
    /barbers/[barberId]/page.tsx ← Barber profile + booking CTA
    /book/page.tsx             ← Booking flow
    /bookings/page.tsx         ← Customer booking history
  /(barber)
    /dashboard/page.tsx        ← Barber overview
    /schedule/page.tsx         ← Availability + upcoming bookings
    /services/page.tsx         ← Manage services
    /profile/page.tsx          ← Edit profile + portfolio
/components
  /ui/                         ← Reusable UI components (Button, Card, etc.)
  /customer/                   ← Customer-specific components
  /barber/                     ← Barber-specific components
  /shared/Navbar.tsx
/lib
  /supabase/client.ts          ← Browser Supabase client
  /supabase/server.ts          ← Server Supabase client
  /stripe.ts                   ← Stripe configuration
  /utils.ts                    ← Utilities + helpers
/types
  database.types.ts            ← TypeScript types for DB schema
/supabase
  /migrations
    001_initial_schema.sql     ← Full DB schema + RLS policies
  /functions
    /send-reminders/           ← Email/SMS reminder Edge Function
    /update-ratings/           ← Barber rating calculation Edge Function
    /waitlist-notify/          ← Waitlist notification Edge Function
    /stripe-payment/           ← Stripe payment helper Edge Function
middleware.ts                  ← Auth protection + role-based routing
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → Create bucket named `barber-media` (public)

### 3. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get your publishable and secret keys from the Dashboard

### 4. Set Up Resend (Email)

1. Create account at [resend.com](https://resend.com)
2. Get your API key

### 5. Set Up Twilio (SMS)

1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID, Auth Token, and a phone number

### 6. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1555xxxxxxx

RESEND_API_KEY=re_xxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8. Test Stripe Webhooks Locally

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/barber-book.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)

### Step 3: Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add all variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_live_...) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number |
| `RESEND_API_KEY` | Resend API key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (https://your-app.vercel.app) |

### Step 4: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
5. Copy the signing secret → Add as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 5: Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy send-reminders
supabase functions deploy update-ratings
supabase functions deploy waitlist-notify
supabase functions deploy stripe-payment

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set TWILIO_ACCOUNT_SID=ACxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxx
supabase secrets set TWILIO_PHONE_NUMBER=+1555xxxxxxx
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 6: Set Up Cron for Reminders

In Supabase Dashboard → Edge Functions → send-reminders → Schedule:
- Cron expression: `0 * * * *` (every hour)

---

## Database Schema

All tables have Row Level Security (RLS) enabled.

| Table | Description |
|---|---|
| `users` | All users (barbers and customers) |
| `barber_profiles` | Barber-specific profile data |
| `services` | Services each barber offers |
| `barber_availability` | Weekly schedule per day |
| `bookings` | All appointment bookings |
| `reviews` | Customer reviews for barbers |
| `barber_media` | Portfolio photos/videos |
| `waitlist` | Customers waiting for slots |

---

## License

MIT