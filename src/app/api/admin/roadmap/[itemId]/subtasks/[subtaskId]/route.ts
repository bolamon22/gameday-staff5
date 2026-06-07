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

export async function PATCH(req: Request, { params }: { params: { itemId: string; subtaskId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { title, completed } = await req.json()
  const client = getClient()
  if (title !== undefined) {
    await client.execute({ sql: 'UPDATE "RoadmapSubtask" SET title = ? WHERE id = ?', args: [title, params.subtaskId] })
  }
  if (completed !== undefined) {
    await client.execute({ sql: 'UPDATE "RoadmapSubtask" SET completed = ? WHERE id = ?', args: [completed ? 1 : 0, params.subtaskId] })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: { itemId: string; subtaskId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const client = getClient()
  await client.execute({ sql: 'DELETE FROM "RoadmapSubtask" WHERE id = ?', args: [params.subtaskId] })
  return NextResponse.json({ ok: true })
}
