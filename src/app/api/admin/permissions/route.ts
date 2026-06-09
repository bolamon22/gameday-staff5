import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import defaultPerms from '@/lib/role-permissions.json'

const SETTING_KEY = 'role_permissions'

async function getPermissions() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
    if (row) return JSON.parse(row.value)
  } catch {}
  // Fall back to the bundled JSON (first load / before migration)
  return defaultPerms
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const perms = await getPermissions()
  return NextResponse.json(perms)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roles } = await req.json()
  const current = await getPermissions()
  current.roles = roles

  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(current) },
    create: { key: SETTING_KEY, value: JSON.stringify(current) },
  })

  return NextResponse.json({ ok: true })
}
