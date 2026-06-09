import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

const SEG_ID = '4b619cff-e35b-4254-89b1-0aa0d299d916'

export async function POST() {
  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
  const results: string[] = []
  try {
    const r1 = await db.execute({
      sql: 'UPDATE "Tournament" SET orgId = ? WHERE orgId IS NULL',
      args: [SEG_ID],
    })
    results.push(`Updated ${r1.rowsAffected} tournaments to SEG`)
    const r2 = await db.execute({
      sql: 'UPDATE "Worker" SET orgId = ? WHERE orgId IS NULL',
      args: [SEG_ID],
    }).catch(() => ({ rowsAffected: 0 }))
    results.push(`Updated ${r2.rowsAffected} workers to SEG`)
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}