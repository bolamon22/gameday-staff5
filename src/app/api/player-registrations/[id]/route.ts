import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.playerRegistration.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const updated = await prisma.playerRegistration.update({
      where: { id: params.id },
      data: {
        playerName: body.playerName,
        playerEmail: body.playerEmail,
        usLacrosseNumber: body.usLacrosseNumber,
        gender: body.gender,
        dob: body.dob,
        grade: body.grade,
        teamClubName: body.teamClubName,
        jerseyNumber: body.jerseyNumber,
        parentName: body.parentName,
        parentEmail: body.parentEmail,
        parentPhone: body.parentPhone,
        parent2Name: body.parent2Name,
        parent2Email: body.parent2Email,
        parent2Phone: body.parent2Phone,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        waiverSignature: body.waiverSignature,
        needsHotel: body.needsHotel,
        wantsUpdates: body.wantsUpdates,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
