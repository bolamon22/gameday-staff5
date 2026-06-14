import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Field-readiness checklist submissions. Stored as JSON in AppSetting key
// `checklists:<id>` (no schema migration). Staff-only.

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AppSetting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  } catch { /* ignore */ }
}

const key = (id: string) => `checklists:${id}`
const EXTERNAL_ROLES = ['coach', 'parent', 'club_director']
const isStaff = (role?: string) => !!role && !EXTERNAL_ROLES.includes(role)

async function readList(id: string) {
  const row = await prisma.appSetting.findUnique({ where: { key: key(id) } })
  if (!row) return []
  try { const v = JSON.parse(row.value || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
async function writeList(id: string, list: any[]) {
  await prisma.appSetting.upsert({
    where: { key: key(id) },
    update: { value: JSON.stringify(list) },
    create: { key: key(id), value: JSON.stringify(list) },
  })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isStaff((session.user as any)?.role)) return NextResponse.json({ submissions: [] }, { status: session ? 403 : 401 })
    await ensureTable()
    return NextResponse.json({ submissions: await readList(params.id) })
  } catch { return NextResponse.json({ submissions: [] }) }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isStaff(role)) return NextResponse.json({ error: 'Staff only' }, { status: 403 })
    await ensureTable()
    const b = await req.json()
    const field = String(b.field || '').trim()
    if (!field) return NextResponse.json({ error: 'Field is required' }, { status: 400 })
    const items = (b.items && typeof b.items === 'object') ? b.items : {}
    const checked = Object.values(items).filter(Boolean).length
    const totalItems = Object.keys(items).length
    const entry = {
      id: Math.random().toString(36).slice(2, 10),
      field,
      items,
      checked,
      total: totalItems,
      note: String(b.note || '').trim(),
      by: session.user?.name || session.user?.email || 'Staff',
      createdAt: new Date().toISOString(),
    }
    const list = await readList(params.id)
    await writeList(params.id, [entry, ...list].slice(0, 200))
    return NextResponse.json({ ok: true, submission: entry })
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session || !isStaff(role)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    await ensureTable()
    const delId = req.nextUrl.searchParams.get('id')
    const me = session.user?.name || session.user?.email || ''
    const list = await readList(params.id)
    const next = list.filter((s: any) => s.id !== delId || (role !== 'director' && s.by !== me))
    await writeList(params.id, next)
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 }) }
}
