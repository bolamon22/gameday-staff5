import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@libsql/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.orgId
  if (!orgId) return NextResponse.json(null)
  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
  const res = await db.execute({ sql: 'SELECT id, name FROM "Organization" WHERE id = ?', args: [orgId] })
  if (res.rows.length === 0) return NextResponse.json(null)
  return NextResponse.json({ id: res.rows[0].id as string, name: res.rows[0].name as string })
}
