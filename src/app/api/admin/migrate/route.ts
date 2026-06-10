import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "IndividualRegistration" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tournamentId" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL DEFAULT '',
        "position" TEXT NOT NULL,
        "numberRequest" TEXT NOT NULL DEFAULT '',
        "jerseySize" TEXT NOT NULL,
        "shortsSize" TEXT NOT NULL,
        "usLacrosseNumber" TEXT NOT NULL DEFAULT '',
        "dateOfBirth" TEXT NOT NULL DEFAULT '',
        "guardianName" TEXT NOT NULL DEFAULT '',
        "guardianPhone" TEXT NOT NULL DEFAULT '',
        "guardianEmail" TEXT NOT NULL DEFAULT '',
        "emergencyContactName" TEXT NOT NULL DEFAULT '',
        "emergencyContactPhone" TEXT NOT NULL DEFAULT '',
        "emergencyRelationship" TEXT NOT NULL DEFAULT '',
        "medicalNotes" TEXT NOT NULL DEFAULT '',
        "waiverSigned" INTEGER NOT NULL DEFAULT 0,
        "waiverSignature" TEXT NOT NULL DEFAULT '',
        "feeTierId" TEXT NOT NULL,
        "feeTierName" TEXT NOT NULL,
        "feeTierAmount" REAL NOT NULL,
        "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
        "stripePaymentIntent" TEXT,
        "stripeSessionId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IndividualRegistration_tournamentId_idx" ON "IndividualRegistration"("tournamentId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IndividualRegistration_email_idx" ON "IndividualRegistration"("email")`)
    return NextResponse.json({ ok: true, message: 'IndividualRegistration table created (or already existed)' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function PUT() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrgPaymentProvider" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "enabled" INTEGER NOT NULL DEFAULT 1,
        "config" TEXT NOT NULL DEFAULT '{}',
        "mode" TEXT NOT NULL DEFAULT 'live',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId","provider")
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrgPaymentProvider_userId_idx" ON "OrgPaymentProvider"("userId")`)
    return NextResponse.json({ ok: true, message: 'OrgPaymentProvider table created' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Pool" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tournamentId" TEXT NOT NULL,
        "division" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "teamNames" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Pool_tournamentId_division_idx" ON "Pool"("tournamentId","division")`)
    return NextResponse.json({ ok: true, message: 'Pool table created (or already existed)' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Bracket" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tournamentId" TEXT NOT NULL,
        "division" TEXT NOT NULL,
        "format" TEXT NOT NULL,
        "teamCount" INTEGER NOT NULL,
        "seeds" TEXT NOT NULL DEFAULT '{}',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Bracket_tournamentId_idx" ON "Bracket"("tournamentId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Bracket_tournamentId_division_idx" ON "Bracket"("tournamentId","division")`)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BracketGame" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "bracketId" TEXT NOT NULL,
        "gameNumber" INTEGER NOT NULL,
        "round" INTEGER NOT NULL,
        "section" TEXT NOT NULL,
        "team1Source" TEXT NOT NULL DEFAULT '',
        "team2Source" TEXT NOT NULL DEFAULT '',
        "label" TEXT NOT NULL DEFAULT '',
        "team1" TEXT NOT NULL DEFAULT '',
        "team2" TEXT NOT NULL DEFAULT '',
        "winner" TEXT NOT NULL DEFAULT '',
        "loser" TEXT NOT NULL DEFAULT '',
        "field" TEXT NOT NULL DEFAULT '',
        "startTime" TEXT NOT NULL DEFAULT '',
        "gameDate" TEXT NOT NULL DEFAULT '',
        FOREIGN KEY ("bracketId") REFERENCES "Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BracketGame_bracketId_idx" ON "BracketGame"("bracketId")`)
    return NextResponse.json({ ok: true, message: 'Bracket and BracketGame tables created (or already existed)' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
