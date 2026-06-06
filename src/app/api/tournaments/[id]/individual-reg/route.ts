import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET — list all individual registrations for a tournament
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const regs = await prisma.individualRegistration.findMany({
    where: { tournamentId: params.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(regs)
}

// POST — create a registration (payment handled separately)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const reg = await prisma.individualRegistration.create({
      data: {
        tournamentId: params.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || '',
        position: body.position,
        numberRequest: body.numberRequest || '',
        jerseySize: body.jerseySize,
        shortsSize: body.shortsSize,
        usLacrosseNumber: body.usLacrosseNumber || '',
        dateOfBirth: body.dateOfBirth || '',
        guardianName: body.guardianName || '',
        guardianPhone: body.guardianPhone || '',
        guardianEmail: body.guardianEmail || '',
        emergencyContactName: body.emergencyContactName || '',
        emergencyContactPhone: body.emergencyContactPhone || '',
        emergencyRelationship: body.emergencyRelationship || '',
        medicalNotes: body.medicalNotes || '',
        waiverSigned: Boolean(body.waiverSigned),
        waiverSignature: body.waiverSignature || '',
        feeTierId: body.feeTierId,
        feeTierName: body.feeTierName,
        feeTierAmount: Number(body.feeTierAmount),
        paymentStatus: body.paymentStatus || 'pending',
        stripeSessionId: body.stripeSessionId || null,
      },
    })

    // Auto-create a PlayerRegistration record so the player appears in the roster
    try {
      await prisma.playerRegistration.create({
        data: {
          tournamentId: params.id,
          playerName: `${body.firstName} ${body.lastName}`,
          playerEmail: body.email || '',
          usLacrosseNumber: body.usLacrosseNumber || '',
          gender: body.gender || '',
          dob: body.dateOfBirth || '',
          grade: body.grade || '',
          teamClubName: body.teamClubName || body.feeTierName || '',
          jerseyNumber: body.numberRequest || '',
          parentName: body.guardianName || '',
          parentEmail: body.guardianEmail || '',
          parentPhone: body.guardianPhone || '',
          emergencyContactName: body.emergencyContactName || '',
          emergencyContactPhone: body.emergencyContactPhone || '',
          waiverSignature: body.waiverSignature || '',
          needsHotel: body.needsHotel || '',
          wantsUpdates: false,
        },
      })
    } catch (e) {
      // Non-fatal — individual reg was already created
      console.error('Failed to auto-create PlayerRegistration:', e)
    }

    return NextResponse.json(reg, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 })
  }
}
