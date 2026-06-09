import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const registration = await prisma.teamRegistration.update({
    where: { id: params.id },
    data: { deletedAt: null },
  })
  return NextResponse.json(registration)
}
