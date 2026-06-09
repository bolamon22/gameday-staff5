import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@libsql/client'

function getClient() {
  return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const client = getClient()
  try {
    const res = await client.execute({
      sql: `SELECT o.* FROM "Organization" o
            INNER JOIN "User" u ON u."orgId" = o.id
            WHERE u.id = ? LIMIT 1`,
      args: [userId],
    })
    if (!res.rows.length) return NextResponse.json(null)
    return NextResponse.json(res.rows[0])
  } catch { return NextResponse.json(null) }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const userId = (session.user as any).id
  const body = await req.json()
  const client = getClient()

  const fields = ['name','logoUrl','contactEmail','contactPhone','website',
    'achBankName','achRoutingNumber','achAccountNumber',
    'paypalEmail','zelleHandle','checkPayableTo','checkAddress']

  const updates = fields.filter(f => body[f] !== undefined)
  if (!updates.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const setClause = updates.map(f => `"${f}" = ?`).join(', ')
  const args = [...updates.map(f => body[f]), userId]

  await client.execute({
    sql: `UPDATE "Organization" SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = (SELECT "orgId" FROM "User" WHERE id = ? LIMIT 1)`,
    args,
  })
  return NextResponse.json({ ok: true })
}
