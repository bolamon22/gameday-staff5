import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Global default tiebreakers (new/unconfigured tournaments inherit these).
export async function GET() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: 'defaultTiebreakers' } })
    return NextResponse.json(row ? JSON.parse(row.value || '{}') : {})
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const value = JSON.stringify({ pool: body.pool || [], division: body.division || [] })
    await prisma.appSetting.upsert({
      where: { key: 'defaultTiebreakers' },
      update: { value },
      create: { key: 'defaultTiebreakers', value },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save default' }, { status: 500 })
  }
}
