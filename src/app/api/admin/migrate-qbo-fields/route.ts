import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const results: string[] = []
  for (const col of ['qboInvoiceId', 'qboCustomerId']) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE TeamRegistration ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`)
      results.push(`Added ${col}`)
    } catch (e: any) {
      if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
        results.push(`${col} already exists`)
      } else throw e
    }
  }
  return NextResponse.json({ ok: true, results })
}
