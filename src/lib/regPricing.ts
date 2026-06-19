// Shared registration-pricing model used by the public register form, the staff
// registrations page, the setup wizard and tournament settings.
//
// Canonical shape: an ordered list of auto-chaining volume brackets (the last
// has `max: null` = "and up"), plus an optional flat-rate tier (e.g. 7v7) that
// applies to teams whose division name contains `match`.

export type Bracket = { max: number | null; price: number }
export type FlatTier = { label: string; match: string; price: number }
export type RegPricing = { tiers: Bracket[]; flat: FlatTier | null }

export const DEFAULT_REG_PRICING: RegPricing = {
  tiers: [
    { max: 3, price: 1495 },
    { max: 6, price: 1450 },
    { max: null, price: 1395 },
  ],
  flat: { label: '7v7 teams', match: '7v7', price: 1095 },
}

const clone = (p: RegPricing): RegPricing => ({ tiers: p.tiers.map(t => ({ ...t })), flat: p.flat ? { ...p.flat } : null })

// Accepts the new shape, the legacy {tier1,tier1Max,...,sevenVSeven} shape, or a
// JSON string of either, and always returns a valid RegPricing.
export function parsePricing(raw: any): RegPricing {
  let o: any = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw || '{}') } catch { o = {} } }
  o = o || {}

  if (Array.isArray(o.tiers) && o.tiers.length) {
    const tiers: Bracket[] = o.tiers.map((t: any) => ({
      max: (t.max === null || t.max === undefined || t.max === '') ? null : Number(t.max),
      price: Number(t.price) || 0,
    }))
    if (!tiers.some(t => t.max === null)) tiers.push({ max: null, price: tiers[tiers.length - 1]?.price || 0 })
    const flat = o.flat
      ? { label: String(o.flat.label || '7v7 teams'), match: String(o.flat.match ?? '7v7'), price: Number(o.flat.price) || 0 }
      : null
    return { tiers, flat }
  }

  if (o.tier1 !== undefined) {
    const t1m = Number(o.tier1Max) || 3, t2m = Number(o.tier2Max) || 6
    const tiers: Bracket[] = [
      { max: t1m, price: Number(o.tier1) || 0 },
      { max: t2m, price: Number(o.tier2) || 0 },
      { max: null, price: Number(o.tier3) || 0 },
    ]
    const flat = (o.sevenVSeven !== undefined && o.sevenVSeven !== null)
      ? { label: '7v7 teams', match: '7v7', price: Number(o.sevenVSeven) || 0 }
      : null
    return { tiers, flat }
  }

  return clone(DEFAULT_REG_PRICING)
}

export function serializePricing(p: RegPricing): string { return JSON.stringify(p) }

export function baseFee(p: RegPricing): number { return p.tiers[0]?.price || 0 }

function rateForCount(tiers: Bracket[], n: number): number {
  for (const t of tiers) { if (t.max === null || n <= t.max) return t.price }
  return tiers[tiers.length - 1]?.price || 0
}

const matchesFlat = (flat: FlatTier | null, division?: string): boolean =>
  !!(flat && flat.match && division && division.toLowerCase().includes(flat.match.toLowerCase()))

// Total invoice for a set of teams (each with a `division` string).
export function calcFee(teams: { division?: string }[], p: RegPricing): number {
  const flatTeams = p.flat ? teams.filter(t => matchesFlat(p.flat, t.division)) : []
  const regular = p.flat ? teams.filter(t => !matchesFlat(p.flat, t.division)) : teams
  let total = flatTeams.length * (p.flat ? p.flat.price : 0)
  total += regular.length * rateForCount(p.tiers, regular.length)
  return total
}

// Human-readable "view fee schedule" lines.
export function feeScheduleLines(p: RegPricing): string[] {
  const fmt = (n: number) => '$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const lines: string[] = []
  let prev = 0
  p.tiers.forEach((t) => {
    if (t.max === null) lines.push(`${prev + 1}+ teams: ${fmt(t.price)}/team`)
    else { lines.push(`${prev + 1}-${t.max} teams: ${fmt(t.price)}/team`); prev = t.max }
  })
  if (p.flat) lines.push(`${p.flat.label}: ${fmt(p.flat.price)}/team`)
  return lines
}
