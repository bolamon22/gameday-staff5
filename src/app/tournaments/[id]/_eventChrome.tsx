import { createClient } from '@libsql/client'
import { OrgHeader, OrgFooter, buildNav } from '@/app/o/[slug]/_chrome'

function db() { return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN }) }

// Wraps a tournament-scoped public page (forms, waiver, vendor) in the org site
// header + footer so visitors stay inside the organization's website.
export default async function EventChrome({ tournamentId, children }: { tournamentId: string; children: React.ReactNode }) {
  const client = db()
  let t: any = {}
  try { const r = await client.execute({ sql: 'SELECT id, name, orgId, teamRegEnabled, logoUrl FROM "Tournament" WHERE id = ?', args: [tournamentId] }); if (r.rows.length) t = r.rows[0] } catch {}
  let org: any = { name: '', slug: '', logoUrl: '', contactEmail: '' }
  let navPages: any[] = []; let hasGallery = false; let contact: any = {}; let socials: any = {}; let orgLogo = ''
  if (t.orgId) {
    try { const o = await client.execute({ sql: 'SELECT id, name, slug, contactEmail, logoUrl FROM "Organization" WHERE id = ?', args: [t.orgId] }); if (o.rows.length) org = o.rows[0] } catch {}
    try { const s = await client.execute({ sql: 'SELECT value FROM "AppSetting" WHERE key = ?', args: [`orgSite:${t.orgId}`] }); if (s.rows.length) { const oc = JSON.parse(((s.rows[0] as any).value as string) || '{}'); orgLogo = oc.logo || ''; navPages = Array.isArray(oc.pages) ? oc.pages : []; hasGallery = Array.isArray(oc.gallery) && oc.gallery.length > 0; contact = oc.contact || {}; socials = oc.socials || {} } } catch {}
  }
  const headerLogo = orgLogo || org.logoUrl || ''
  const orgForChrome = { name: org.name, logoUrl: headerLogo, contactEmail: org.contactEmail }
  const nav = org.slug ? buildNav(org.slug, navPages, hasGallery) : []
  const registerHref = Number(t.teamRegEnabled) ? `/tournaments/${tournamentId}/register` : undefined
  return (
    <>
      {org.slug && <OrgHeader org={orgForChrome} slug={org.slug} nav={nav} registerHref={registerHref} />}
      {children}
      {org.slug && <OrgFooter org={orgForChrome} contact={contact} socials={socials} />}
    </>
  )
}
