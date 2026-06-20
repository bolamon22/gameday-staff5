import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export const runtime = 'nodejs'

function db() {
  return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
}

// Serves an image previously stored by /api/upload.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = db()
    const r = await client.execute({ sql: 'SELECT mime, data FROM "UploadedImage" WHERE id = ?', args: [params.id] })
    if (!r.rows.length) return new NextResponse('Not found', { status: 404 })
    const row = r.rows[0] as any
    const raw = row.data
    const body = raw instanceof Uint8Array ? raw : new Uint8Array(raw as ArrayBuffer)
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': String(row.mime || 'image/jpeg'), 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new NextResponse('Error', { status: 500 })
  }
}
