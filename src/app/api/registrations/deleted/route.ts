import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tournamentId = searchParams.get('tournamentId')
  if (!tournamentId) return NextResponse.json([])

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 15)

  // Hard-purge anything older than 15 days
  await prisma.teamRegistration.deleteMany({
    where: {
      tournamentId,
      deletedAt: { not: null, lt: cutoff },
    },
  })

  const deleted = await prisma.teamRegistration.findMany({
    where: { tournamentId, deletedAt: { not: null } },
    include: { teams: true },
    orderBy: { deletedAt: 'desc' },
  })
  return NextResponse.json(deleted)
}
