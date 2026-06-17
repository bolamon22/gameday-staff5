import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AppSetting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  } catch { /* ignore */ }
}

// Editable content for an org's public website (/o/[slug]). Stored per-org in AppSetting.
export async function GET() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.orgId
  if (!orgId) return NextResponse.json({})
  try {
    await ensureTable()
    const row = await prisma.appSetting.findUnique({ where: { key: `orgSite:${orgId}` } })
    return NextResponse.json(row ? JSON.parse(row.value || '{}') : {})
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as any)?.orgId
  const role = (session?.user as any)?.role
  if (!orgId) return NextResponse.json({ error: 'No organization on your account' }, { status: 403 })
  if (role !== 'admin' && role !== 'director') return NextResponse.json({ error: 'Only an admin or director can edit the website' }, { status: 403 })
  try {
    await ensureTable()
    const value = JSON.stringify(await req.json() || {})
    await prisma.appSetting.upsert({
      where: { key: `orgSite:${orgId}` },
      update: { value },
      create: { key: `orgSite:${orgId}`, value },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save' }, { status: 500 })
  }
}
