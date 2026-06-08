import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encryptConfig, decryptConfig } from '@/lib/encrypt'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, userId, provider, enabled, config, mode, createdAt FROM OrgPaymentProvider WHERE userId = ?`, userId
  )
  // Return config with sensitive fields masked
  const providers = rows.map(r => {
    const cfg = decryptConfig(r.config)
    return {
      id: r.id, provider: r.provider, enabled: !!r.enabled, mode: r.mode, createdAt: r.createdAt,
      connected: Object.keys(cfg).length > 0,
      // Only expose non-secret fields for display
      displayInfo: getDisplayInfo(r.provider, cfg),
    }
  })
  return NextResponse.json(providers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const { provider, config, mode = 'live' } = await req.json()
  if (!provider || !config) return NextResponse.json({ error: 'provider and config required' }, { status: 400 })

  const id = crypto.randomUUID()
  const encryptedConfig = encryptConfig(config)
  const now = new Date().toISOString()

  // Upsert: delete existing first, then insert
  await prisma.$executeRawUnsafe(
    `DELETE FROM OrgPaymentProvider WHERE userId = ? AND provider = ?`, userId, provider
  )
  await prisma.$executeRawUnsafe(
    `INSERT INTO OrgPaymentProvider (id, userId, provider, enabled, config, mode, createdAt, updatedAt)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?)`,
    id, userId, provider, encryptedConfig, mode, now, now
  )
  return NextResponse.json({ ok: true, id })
}

function getDisplayInfo(provider: string, cfg: Record<string, string>): Record<string, string> {
  if (provider === 'stripe') {
    return { publishableKey: cfg.publishableKey ? cfg.publishableKey.slice(0, 12) + '…' : '' }
  }
  if (provider === 'quickbooks') {
    return { companyId: cfg.companyId || '', email: cfg.email || '' }
  }
  if (provider === 'paypal') {
    return { clientId: cfg.clientId ? cfg.clientId.slice(0, 12) + '…' : '' }
  }
  return {}
}
