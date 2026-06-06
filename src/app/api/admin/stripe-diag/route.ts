import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: 'No STRIPE_SECRET_KEY' })

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    'Stripe-Version': '2024-06-20',
  }

  const results: Record<string, any> = { keyPrefix: key.substring(0, 15) }

  // GET /v1/account (singular) - returns account owning the key
  try {
    const r = await fetch('https://api.stripe.com/v1/account', { headers })
    results.account = await r.json()
  } catch (e: any) { results.account = { error: e.message } }

  // GET /v1/accounts (plural) - lists connected/org accounts
  try {
    const r = await fetch('https://api.stripe.com/v1/accounts?limit=5', { headers })
    results.accounts = await r.json()
  } catch (e: any) { results.accounts = { error: e.message } }

  return NextResponse.json(results)
}
