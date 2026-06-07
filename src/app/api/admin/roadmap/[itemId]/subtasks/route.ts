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
    CREATE TABLE IF NOT EXISTS "RoadmapSubtask" (
      id        TEXT PRIMARY KEY,
      itemId    TEXT NOT NULL,
      title     TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `)
}

export async function GET(req: Request, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const client = getClient()
  await ensureTable(client)
  const result = await client.execute({
    sql: 'SELECT * FROM "RoadmapSubtask" WHERE itemId = ? ORDER BY createdAt ASC',
    args: [params.itemId],
  })
  return NextResponse.json(result.rows)
}

export async function POST(req: Request, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  const client = getClient()
  await ensureTable(client)
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await client.execute({
    sql: 'INSERT INTO "RoadmapSubtask" (id, itemId, title, completed, createdAt) VALUES (?, ?, ?, 0, ?)',
    args: [id, params.itemId, title.trim(), createdAt],
  })
  return NextResponse.json({ id, itemId: params.itemId, title: title.trim(), completed: 0, createdAt }, { status: 201 })
}
