import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
    const authToken = process.env.TURSO_AUTH_TOKEN || '';
    const client = createClient({ url, authToken });
    await client.execute('ALTER TABLE "Worker" ADD COLUMN "association" TEXT NOT NULL DEFAULT ""');
    return NextResponse.json({ ok: true, message: 'Column added' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, message: msg });
  }
}
