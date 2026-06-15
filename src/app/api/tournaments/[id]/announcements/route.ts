import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// In-app broadcasts/announcements. Stored as JSON in the hand-migrated AppSetting
// table (no schema migration needed): key `announcements:<id>`.
// GET is public (the public page banner reads it). POST/DELETE require a logged-in
// staffer whose role the director has allowed to broadcast (key `broadcastRoles:<id>`).

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AppSetting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  } catch { /* ignore */ }
}

const annKey = (id: string) => `announcements:${id}`
const rolesKey = (id: string) => `broadcastRoles:${id}`
const DEFAULT_BROADCAST_ROLES = ['director', 'assigner']

async function readJson(key: string, fallback: any) {
  const row = await prisma.appSetting.findUnique({ where: { key } })
  if (!row) return fallback
  try { const v = JSON.parse(row.value || 'null'); return v ?? fallback } catch { return fallback }
}

// Admin and director are always allowed; otherwise the role must be in the configured list.
async function canBroadcast(id: string, role: string | undefined) {
  if (!role) return false
  if (role === 'admin' || role === 'director') return true
  const allowed = await readJson(rolesKey(id), DEFAULT_BROADCAST_ROLES)
  return Array.isArray(allowed) && allowed.includes(role)
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureTable()
    const list = await readJson(annKey(params.id), [])
    return NextResponse.json({ announcements: Array.isArray(list) ? list : [] })
  } catch {
    return NextResponse.json({ announcements: [] })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await canBroadcast(params.id, role))) return NextResponse.json({ error: 'Not allowed to broadcast' }, { status: 403 })

    await ensureTable()
    const body = await req.json()
    const text = String(body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const entry = {
      id: Math.random().toString(36).slice(2, 10),
      text,
      scope: String(body.scope || 'Everyone'),
      urgent: Boolean(body.urgent),
      createdAt: new Date().toISOString(),
      createdBy: session.user?.name || session.user?.email || 'Staff',
    }
    const list = await readJson(annKey(params.id), [])
    const next = [entry, ...(Array.isArray(list) ? list : [])].slice(0, 50)
    await prisma.appSetting.upsert({
      where: { key: annKey(params.id) },
      update: { value: JSON.stringify(next) },
      create: { key: annKey(params.id), value: JSON.stringify(next) },
    })
    return NextResponse.json({ ok: true, announcement: entry })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await canBroadcast(params.id, role))) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

    await ensureTable()
    const delId = req.nextUrl.searchParams.get('id')
    const list = await readJson(annKey(params.id), [])
    const next = (Array.isArray(list) ? list : []).filter((a: any) => a.id !== delId)
    await prisma.appSetting.upsert({
      where: { key: annKey(params.id) },
      update: { value: JSON.stringify(next) },
      create: { key: annKey(params.id), value: JSON.stringify(next) },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete' }, { status: 500 })
  }
}
