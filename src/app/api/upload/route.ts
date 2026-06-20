import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export const runtime = 'nodejs'

function db() {
  return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
}

async function ensure(client: ReturnType<typeof db>) {
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS "UploadedImage" ("id" TEXT PRIMARY KEY, "mime" TEXT NOT NULL, "data" BLOB NOT NULL, "createdAt" TEXT NOT NULL DEFAULT (datetime('now')))`)
  } catch { /* ignore */ }
}

// Stores the uploaded image as a DB blob and returns a short URL (/api/img/<id>).
// Keeping image bytes out of the site/event JSON lets galleries hold many photos
// without blowing the request/row size limits. Falls back to an inline data URL
// only if the DB write fails, so uploads never hard-fail.
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = file.type || 'image/jpeg'

  try {
    const client = db()
    await ensure(client)
    const id = (globalThis.crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2)))
    await client.execute({ sql: 'INSERT INTO "UploadedImage" ("id","mime","data") VALUES (?,?,?)', args: [id, mimeType, bytes] })
    return NextResponse.json({ url: `/api/img/${id}` })
  } catch {
    const base64 = Buffer.from(bytes).toString('base64')
    return NextResponse.json({ url: `data:${mimeType};base64,${base64}` })
  }
}
