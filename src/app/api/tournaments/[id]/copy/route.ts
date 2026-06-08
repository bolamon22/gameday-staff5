import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createClient } from '@libsql/client'

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { name, startDate, endDate, dates } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const src = await prisma.tournament.findUnique({ where: { id: params.id } })
  if (!src) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load source venues (raw column)
  const client = getClient()
  let venuesJson = '{}'
  try {
    const r = await client.execute({ sql: 'SELECT venues FROM "Tournament" WHERE id = ?', args: [params.id] })
    venuesJson = (r.rows[0]?.venues as string) || '{}'
  } catch { /* venues column may not exist yet */ }

  // Create new tournament — copy all settings, fresh schedule data
  const newT = await prisma.tournament.create({
    data: {
      name: name.trim(),
      sport: src.sport,
      location: src.location,
      logoUrl: src.logoUrl,
      scheduleIncrement: src.scheduleIncrement,
      payRates: src.payRates,
      registrationPricing: src.registrationPricing,
      registrationDivisions: src.registrationDivisions,
      divisionRules: src.divisionRules,
      teamRegEnabled: src.teamRegEnabled,
      individualRegEnabled: src.individualRegEnabled,
      individualRegDescription: src.individualRegDescription,
      individualRegTiers: src.individualRegTiers,
      individualRegPositions: src.individualRegPositions,
      individualRegSizes: src.individualRegSizes,
      startDate: startDate ?? '',
      endDate: endDate ?? '',
      dates: dates ? JSON.stringify(dates) : '[]',
    }
  })

  // Copy venues to new tournament
  try {
    await client.execute(`ALTER TABLE "Tournament" ADD COLUMN "venues" TEXT NOT NULL DEFAULT '[]'`)
  } catch { /* already exists */ }
  await client.execute({
    sql: 'UPDATE "Tournament" SET venues = ? WHERE id = ?',
    args: [venuesJson, newT.id],
  })

  // Copy staff roster entries
  const rosterEntries = await prisma.rosterEntry.findMany({ where: { tournamentId: params.id } })
  if (rosterEntries.length > 0) {
    await prisma.rosterEntry.createMany({
      data: rosterEntries.map(r => ({
        workerId: r.workerId,
        tournamentId: newT.id,
        gameTarget: r.gameTarget,
        notes: r.notes ?? undefined,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ id: newT.id, name: newT.name })
}
