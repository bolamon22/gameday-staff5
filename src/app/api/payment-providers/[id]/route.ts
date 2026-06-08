import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decryptConfig } from '@/lib/encrypt'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, userId, provider, enabled, config, mode FROM OrgPaymentProvider WHERE id = ? AND userId = ?`,
    params.id, userId
  )
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const r = rows[0]
  const cfg = decryptConfig(r.config)
  return NextResponse.json({ ...r, config: cfg })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  await prisma.$executeRawUnsafe(
    `DELETE FROM OrgPaymentProvider WHERE id = ? AND userId = ?`, params.id, userId
  )
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { enabled } = await req.json()
  await prisma.$executeRawUnsafe(
    `UPDATE OrgPaymentProvider SET enabled = ?, updatedAt = ? WHERE id = ? AND userId = ?`,
    enabled ? 1 : 0, new Date().toISOString(), params.id, userId
  )
  return NextResponse.json({ ok: true })
}
