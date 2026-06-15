import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Live in-progress scores so parents can follow on the public page (no login).
// Each game's live state is stored in AppSetting under key `liveScore:<gameId>`:
//   { score1, score2, period, periodLabel, live, updatedAt }
// GET is public (returns a map keyed by gameId). POST requires a staffer (the scorekeeper).

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AppSetting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  } catch { /* ignore */ }
}

const EXTERNAL_ROLES = ['coach', 'parent', 'club_director']
const isStaff = (role?: string) => !!role && !EXTERNAL_ROLES.includes(role)

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureTable()
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT "key","value" FROM "AppSetting" WHERE "key" LIKE 'liveScore:%'`)
    const scores: Record<string, any> = {}
    for (const r of rows || []) {
      const gameId = String(r.key).slice('liveScore:'.length)
      try { scores[gameId] = JSON.parse(r.value || '{}') } catch { /* skip */ }
    }
    return NextResponse.json({ scores })
  } catch {
    return NextResponse.json({ scores: {} })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isStaff(role)) return NextResponse.json({ error: 'Staff only' }, { status: 403 })

    await ensureTable()
    const body = await req.json().catch(() => ({}))
    const gameId = String(body.gameId || '').trim()
    if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 })

    const entry = {
      score1: Number(body.score1) || 0,
      score2: Number(body.score2) || 0,
      period: Number(body.period) || 1,
      periodLabel: String(body.periodLabel || ''),
      live: !!body.live,
      updatedAt: new Date().toISOString(),
    }
    const k = `liveScore:${gameId}`
    await prisma.appSetting.upsert({
      where: { key: k },
      update: { value: JSON.stringify(entry) },
      create: { key: k, value: JSON.stringify(entry) },
    })
    return NextResponse.json({ ok: true, ...entry })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save' }, { status: 500 })
  }
}
