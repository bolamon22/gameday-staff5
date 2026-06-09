import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@libsql/client'

function getClient() {
  return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const client = getClient()
  const steps: string[] = []

  // 1. Create Organization table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Organization" (
      "id"                   TEXT NOT NULL PRIMARY KEY,
      "name"                 TEXT NOT NULL,
      "slug"                 TEXT NOT NULL UNIQUE,
      "logoUrl"              TEXT NOT NULL DEFAULT '',
      "contactEmail"         TEXT NOT NULL DEFAULT '',
      "contactPhone"         TEXT NOT NULL DEFAULT '',
      "website"              TEXT NOT NULL DEFAULT '',
      "achBankName"          TEXT NOT NULL DEFAULT '',
      "achRoutingNumber"     TEXT NOT NULL DEFAULT '',
      "achAccountNumber"     TEXT NOT NULL DEFAULT '',
      "paypalEmail"          TEXT NOT NULL DEFAULT '',
      "zelleHandle"          TEXT NOT NULL DEFAULT '',
      "checkPayableTo"       TEXT NOT NULL DEFAULT '',
      "checkAddress"         TEXT NOT NULL DEFAULT '',
      "subscriptionTier"     TEXT NOT NULL DEFAULT 'starter',
      "subscriptionStatus"   TEXT NOT NULL DEFAULT 'active',
      "stripeCustomerId"     TEXT NOT NULL DEFAULT '',
      "stripeSubscriptionId" TEXT NOT NULL DEFAULT '',
      "createdAt"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  steps.push('Created Organization table')

  // 2. Add orgId column to Tournament (if not exists)
  try {
    await client.execute(`ALTER TABLE "Tournament" ADD COLUMN "orgId" TEXT`)
    steps.push('Added orgId to Tournament')
  } catch { steps.push('orgId already exists on Tournament') }

  // 3. Add orgId column to User (if not exists)
  try {
    await client.execute(`ALTER TABLE "User" ADD COLUMN "orgId" TEXT`)
    steps.push('Added orgId to User')
  } catch { steps.push('orgId already exists on User') }

  // 4. Seed "Sunshine Events Group" if not already there
  const existing = await client.execute(`SELECT id FROM "Organization" WHERE slug = 'sunshine-events-group'`)
  let orgId: string
  if (existing.rows.length > 0) {
    orgId = existing.rows[0].id as string
    steps.push('Sunshine Events Group already exists')
  } else {
    orgId = crypto.randomUUID()
    await client.execute({
      sql: `INSERT INTO "Organization" (id, name, slug, contactEmail, checkPayableTo, checkAddress, zelleHandle, subscriptionTier, createdAt, updatedAt)
            VALUES (?, 'Sunshine Events Group', 'sunshine-events-group', 'info@sunshinelax.com', 'Sunshine Events Group', '11830 Wiles Rd. Coral Springs, FL 33076', 'info@sunshinelax.com', 'pro', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [orgId],
    })
    steps.push(`Created Sunshine Events Group (id: ${orgId})`)
  }

  // 5. Link all tournaments to Sunshine Events Group
  const result = await client.execute({
    sql: `UPDATE "Tournament" SET "orgId" = ? WHERE "orgId" IS NULL`,
    args: [orgId],
  })
  steps.push(`Linked ${result.rowsAffected} tournaments to Sunshine Events Group`)

  // 6. Link all users to Sunshine Events Group
  const userResult = await client.execute({
    sql: `UPDATE "User" SET "orgId" = ? WHERE "orgId" IS NULL`,
    args: [orgId],
  })
  steps.push(`Linked ${userResult.rowsAffected} users to Sunshine Events Group`)

  return NextResponse.json({ ok: true, orgId, steps })
}
