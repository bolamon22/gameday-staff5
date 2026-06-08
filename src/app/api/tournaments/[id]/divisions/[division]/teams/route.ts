import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string; division: string } }) {
  try {
    const division = decodeURIComponent(params.division)

    const teams = await prisma.registeredTeam.findMany({
      where: { registration: { tournamentId: params.id }, division },
      include: { registration: { select: { invoiceAmount: true, payments: { select: { amount: true } } } } },
      orderBy: { teamName: 'asc' },
    })

    let pools: { id: string; name: string; teamNames: string }[] = []
    try {
      pools = await prisma.pool.findMany({
        where: { tournamentId: params.id, division },
        orderBy: { name: 'asc' },
      })
    } catch { /* Pool table not migrated yet */ }

    const teamPool = new Map<string, string>()
    for (const pool of pools) {
      const names: string[] = JSON.parse(pool.teamNames || '[]')
      for (const n of names) teamPool.set(n, pool.name)
    }

    const result = teams.map(t => {
      const paid = t.registration.payments.reduce((s, p) => s + p.amount, 0)
      const owed = t.registration.invoiceAmount
      return {
        id: t.id,
        teamName: t.teamName,
        clubName: t.clubName,
        division: t.division,
        coachName: t.coachName,
        coachPhone: t.coachPhone,
        coachEmail: t.coachEmail,
        pool: teamPool.get(t.teamName) ?? null,
        paid, owed,
        paymentStatus: paid >= owed && owed > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      }
    })

    const parsedPools = pools.map(p => ({ ...p, teamNames: JSON.parse(p.teamNames || '[]') }))
    return NextResponse.json({ teams: result, pools: parsedPools })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 })
  }
}

// PATCH: move a team to a different division
export async function PATCH(req: NextRequest, { params }: { params: { id: string; division: string } }) {
  try {
    const { teamId, newDivision } = await req.json()
    if (!teamId || !newDivision?.trim()) return NextResponse.json({ error: 'teamId and newDivision required' }, { status: 400 })

    const division = decodeURIComponent(params.division)

    // Update the RegisteredTeam record
    await prisma.registeredTeam.update({
      where: { id: teamId },
      data: { division: newDivision.trim() },
    })

    // Remove team from any pool in old division
    const oldPools = await prisma.pool.findMany({
      where: { tournamentId: params.id, division },
    }).catch(() => [] as { id: string; teamNames: string }[])

    const team = await prisma.registeredTeam.findUnique({ where: { id: teamId }, select: { teamName: true } })
    if (team) {
      for (const pool of oldPools) {
        const names: string[] = JSON.parse(pool.teamNames || '[]')
        if (names.includes(team.teamName)) {
          await prisma.pool.update({
            where: { id: pool.id },
            data: { teamNames: JSON.stringify(names.filter(n => n !== team.teamName)) },
          }).catch(() => {})
        }
      }
    }

    // Ensure the new division exists in registrationDivisions
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id }, select: { registrationDivisions: true },
    })
    const regDivs: string[] = JSON.parse(tournament?.registrationDivisions ?? '[]')
    if (!regDivs.includes(newDivision.trim())) {
      await prisma.tournament.update({
        where: { id: params.id },
        data: { registrationDivisions: JSON.stringify([...regDivs, newDivision.trim()].sort()) },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to move team' }, { status: 500 })
  }
}
