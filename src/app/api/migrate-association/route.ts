import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Worker" ADD COLUMN "association" TEXT NOT NULL DEFAULT ""');
    return NextResponse.json({ ok: true, message: 'Column added' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, message: msg });
  }
}
