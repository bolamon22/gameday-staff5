import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Lightweight teamName -> logoUrl map for a tournament (used by the public results page).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teams = await prisma.registeredTeam.findMany({
      where: { registration: { tournamentId: params.id } },
      select: { teamName: true, logoUrl: true },
    })
    const map: Record<string, string> = {}
    for (const t of teams) if (t.teamName && t.logoUrl) map[t.teamName] = t.logoUrl
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}
