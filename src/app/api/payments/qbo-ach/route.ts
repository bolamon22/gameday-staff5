import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getQBOAccessToken } from '@/lib/paymentProviders'
import { prisma } from '@/lib/db'

// POST: charge a bank account via QBO ACH
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const { registrationId, amount, bankAccountNumber, bankRoutingNumber, accountType, accountName, notes } = await req.json()
  if (!registrationId || !amount || !bankAccountNumber || !bankRoutingNumber)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const tokens = await getQBOAccessToken(userId)
  if (!tokens) return NextResponse.json({ error: 'QuickBooks not connected. Please connect in Admin → Payment Providers.' }, { status: 503 })

  try {
    // Create QBO bank account token
    const tokenRes = await fetch(`https://api.intuit.com/quickbooks/v4/payments/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        'Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({
        bankAccount: {
          routingNumber: bankRoutingNumber,
          accountNumber: bankAccountNumber,
          accountType: accountType || 'PERSONAL_CHECKING',
          name: accountName || 'Account Holder',
          phone: '0000000000',
        }
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokenData?.errors?.[0]?.message || 'Bank token creation failed')

    // Charge the bank account
    const chargeRes = await fetch(`https://api.intuit.com/quickbooks/v4/payments/echecks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        'Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: amount.toFixed(2),
        token: tokenData.value,
        description: `Tournament registration payment`,
      }),
    })
    const chargeData = await chargeRes.json()
    if (!chargeRes.ok) throw new Error(chargeData?.errors?.[0]?.message || 'ACH charge failed')

    // Record payment in app
    const today = new Date().toISOString().slice(0, 10)
    await prisma.$executeRawUnsafe(
      `INSERT INTO RegistrationPayment (id, registrationId, amount, method, checkNumber, receivedAt, notes, createdAt)
       VALUES (?, ?, ?, 'ach', '', ?, ?, ?)`,
      crypto.randomUUID(), registrationId, amount,
      today, notes || `ACH eCheck — QBO ID: ${chargeData.id}`, new Date().toISOString()
    )

    return NextResponse.json({ ok: true, chargeId: chargeData.id, status: chargeData.status })
  } catch (err: any) {
    console.error('QBO ACH error:', err)
    return NextResponse.json({ error: err.message || 'ACH payment failed' }, { status: 500 })
  }
}
