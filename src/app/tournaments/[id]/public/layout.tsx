import type { Metadata } from 'next'
import { createClient } from '@libsql/client'
import { abs, clip } from '@/lib/seo'

function db() { return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN }) }

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  let name = 'Tournament'
  try { const r = await db().execute({ sql: 'SELECT name FROM "Tournament" WHERE id = ?', args: [params.id] }); if (r.rows.length) name = (r.rows[0] as any).name } catch {}
  const title = `Schedule & standings — ${name}`
  const description = clip(`Live game schedule, scores and standings for ${name}.`)
  const url = abs(`/tournaments/${params.id}/public`)
  return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { title, description, url }, twitter: { title, description } }
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
