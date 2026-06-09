import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "TeamRegistration" ADD COLUMN "deletedAt" DATETIME`)
  } catch (_) { /* column may already exist */ }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "PlayerRegistration" ADD COLUMN "deletedAt" DATETIME`)
  } catch (_) { /* column may already exist */ }
  return NextResponse.json({ ok: true })
}
