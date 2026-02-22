import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
  typescript: true,
})

export const DEPOSIT_PERCENTAGE = 0.5 // 50% deposit

export function calculateDeposit(totalPrice: number): number {
  return Math.round(totalPrice * DEPOSIT_PERCENTAGE * 100) // in cents
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
