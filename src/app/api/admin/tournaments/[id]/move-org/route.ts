import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@libsql/client'

function db() {
  return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { orgId } = await req.json()
  await db().execute({
    sql: 'UPDATE "Tournament" SET orgId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    args: [orgId ?? null, params.id],
  })
  return NextResponse.json({ ok: true })
}
