import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  const acctId = process.env.STRIPE_ACCOUNT_ID

  if (!key) return NextResponse.json({ error: 'No STRIPE_SECRET_KEY' })

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    'Stripe-Version': '2024-06-20',
  }
  if (acctId) {
    headers['Stripe-Context'] = acctId
  }

  const results: Record<string, any> = {
    keyPrefix: key.substring(0, 15),
    accountIdPrefix: acctId ? acctId.substring(0, 12) + '...' : 'NOT_SET',
    accountIdLength: acctId?.length ?? 0,
  }

  // Try fetching account details with the context header
  try {
    const r = await fetch('https://api.stripe.com/v1/account', { headers })
    results.account = await r.json()
  } catch (e: any) { results.account = { error: e.message } }

  return NextResponse.json(results)
}
