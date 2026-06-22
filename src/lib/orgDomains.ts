// Custom domains → org slug, for serving an org's pages AT a custom domain root
// (host-based routing in middleware + root-relative org chrome links).
//
// NOTE: Sunshine Events Group uses a simpler GoDaddy 302 *forward*
// (sunshinelax.com → whistleready.app/o/sunshine-events-group), so it is NOT
// listed here — a forwarded domain never reaches the app as its own host.
// Add an entry here only to host an org's pages directly under its domain
// (then add the domain in Vercel + point DNS at Vercel).
export const ORG_DOMAINS: Record<string, string> = {}

export function hostOnly(host?: string | null): string {
  return (host || '').toLowerCase().split(':')[0]
}
export function orgSlugForHost(host?: string | null): string | null {
  return ORG_DOMAINS[hostOnly(host)] || null
}
export function isCustomOrgHost(host?: string | null): boolean {
  return !!orgSlugForHost(host)
}
