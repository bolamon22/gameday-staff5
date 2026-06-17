import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AppSetting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  } catch { /* ignore */ }
}

// Admins may pass ?org=<id> to manage any org's forms; others use their own org.
function targetOrgId(req: NextRequest, session: any): string | null {
  const role = session?.user?.role
  const paramOrg = new URL(req.url).searchParams.get('org')
  if (role === 'admin' && paramOrg) return paramOrg
  return session?.user?.orgId ?? null
}

// Reusable org-level forms library (player waiver, vendor, etc.). Per-org in AppSetting.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const orgId = targetOrgId(req, session)
  if (!orgId) return NextResponse.json({})
  try {
    await ensureTable()
    const row = await prisma.appSetting.findUnique({ where: { key: `orgForms:${orgId}` } })
    return NextResponse.json(row ? JSON.parse(row.value || '{}') : {})
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin' && role !== 'director') return NextResponse.json({ error: 'Only an admin or director can edit forms' }, { status: 403 })
  const orgId = targetOrgId(req, session)
  if (!orgId) return NextResponse.json({ error: 'No organization selected' }, { status: 403 })
  try {
    await ensureTable()
    const value = JSON.stringify(await req.json() || {})
    await prisma.appSetting.upsert({
      where: { key: `orgForms:${orgId}` },
      update: { value },
      create: { key: `orgForms:${orgId}`, value },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save' }, { status: 500 })
  }
}
