import { createClient } from '@libsql/client'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'
function db() { return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN }) }

export async function GET() {
  let body = `# Whistle Ready\n\n> Whistle Ready powers public tournament websites for sports event organizers: upcoming tournaments, live schedules and standings, online team registration, rules, hotels, and photo galleries.\n\n`
  try {
    const client = db()
    const orgs = await client.execute('SELECT id, name, slug FROM "Organization"')
    for (const o of orgs.rows as any[]) {
      const slug = String(o.slug || ''); if (!slug) continue
      body += `## ${o.name}\n- [${o.name} — home](${SITE_URL}/o/${slug})\n`
      try {
        const ts = await client.execute({ sql: 'SELECT id, name FROM "Tournament" WHERE orgId = ? ORDER BY startDate', args: [o.id] })
        for (const t of ts.rows as any[]) body += `- [${t.name}](${SITE_URL}/tournaments/${t.id}/event)\n`
      } catch {}
      body += `\n`
    }
  } catch {}
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
