import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@libsql/client'

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}

async function ensureTable(client: ReturnType<typeof getClient>) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "RoadmapItem" (
      id          TEXT PRIMARY KEY,
      num         INTEGER,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'todo',
      notes       TEXT NOT NULL DEFAULT '',
      createdAt   TEXT NOT NULL
    )
  `)
  try { await client.execute(`ALTER TABLE "RoadmapItem" ADD COLUMN notes TEXT NOT NULL DEFAULT ''`) } catch {}
  try { await client.execute(`ALTER TABLE "RoadmapItem" ADD COLUMN num INTEGER`) } catch {}
  // Backfill num for existing rows that don't have one
  await client.execute(`
    UPDATE "RoadmapItem"
    SET num = (
      SELECT COUNT(*) FROM "RoadmapItem" r2
      WHERE r2.createdAt <= "RoadmapItem".createdAt
    )
    WHERE num IS NULL
  `)
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const client = getClient()
  await ensureTable(client)
  const result = await client.execute('SELECT * FROM "RoadmapItem" ORDER BY createdAt DESC')
  return NextResponse.json(result.rows)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { title, description } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  const client = getClient()
  await ensureTable(client)
  // Get next number
  const maxRes = await client.execute('SELECT MAX(num) as maxNum FROM "RoadmapItem"')
  const maxNum = (maxRes.rows[0]?.maxNum as number) ?? 0
  const num = maxNum + 1
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await client.execute({
    sql: 'INSERT INTO "RoadmapItem" (id, num, title, description, status, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, num, title.trim(), (description ?? '').trim(), 'todo', '', createdAt],
  })
  return NextResponse.json({ id, num, title: title.trim(), description: (description ?? '').trim(), status: 'todo', notes: '', createdAt }, { status: 201 })
}
