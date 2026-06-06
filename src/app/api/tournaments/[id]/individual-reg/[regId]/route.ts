import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; regId: string } }
) {
  try {
    const body = await req.json()
    const reg = await prisma.individualRegistration.update({
      where: { id: params.regId },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.numberRequest !== undefined && { numberRequest: body.numberRequest }),
        ...(body.jerseySize !== undefined && { jerseySize: body.jerseySize }),
        ...(body.shortsSize !== undefined && { shortsSize: body.shortsSize }),
        ...(body.usLacrosseNumber !== undefined && { usLacrosseNumber: body.usLacrosseNumber }),
        ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth }),
        ...(body.guardianName !== undefined && { guardianName: body.guardianName }),
        ...(body.guardianPhone !== undefined && { guardianPhone: body.guardianPhone }),
        ...(body.guardianEmail !== undefined && { guardianEmail: body.guardianEmail }),
        ...(body.emergencyContactName !== undefined && { emergencyContactName: body.emergencyContactName }),
        ...(body.emergencyContactPhone !== undefined && { emergencyContactPhone: body.emergencyContactPhone }),
        ...(body.emergencyRelationship !== undefined && { emergencyRelationship: body.emergencyRelationship }),
        ...(body.medicalNotes !== undefined && { medicalNotes: body.medicalNotes }),
        ...(body.waiverSigned !== undefined && { waiverSigned: Boolean(body.waiverSigned) }),
        ...(body.waiverSignature !== undefined && { waiverSignature: body.waiverSignature }),
        ...(body.feeTierId !== undefined && { feeTierId: body.feeTierId }),
        ...(body.feeTierName !== undefined && { feeTierName: body.feeTierName }),
        ...(body.feeTierAmount !== undefined && { feeTierAmount: Number(body.feeTierAmount) }),
        ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      },
    })
    return NextResponse.json(reg)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; regId: string } }
) {
  try {
    await prisma.individualRegistration.delete({ where: { id: params.regId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 })
  }
}
