// Shared standings calculation (mirrors the public results page).
export type Game = {
  id: string; gameNumber: string; date: string; startTime: string; division: string
  pool: string | null; location: string; team1: string; team2: string
  score1: number | null; score2: number | null; isCanceled: boolean; isChampionship: boolean
}
export type Standing = { team: string; w: number; l: number; t: number; gf: number; ga: number; pts: number }

export const DEFAULT_TBS = ['record', 'goal_diff', 'goals_for']

export function calcStandings(games: Game[], division: string, pool?: string, tbs: string[] = DEFAULT_TBS): Standing[] {
  const map: Record<string, Standing> = {}
  const ensure = (t: string) => { if (!map[t]) map[t] = { team: t, w: 0, l: 0, t: 0, gf: 0, ga: 0, pts: 0 } }
  const rel = games.filter(g => g.division === division && !g.isCanceled && !g.isChampionship && (pool !== undefined ? g.pool === pool : true))
  rel.forEach(g => { ensure(g.team1); ensure(g.team2) })
  const scored = rel.filter(g => g.score1 !== null && g.score2 !== null)
  scored.forEach(g => {
    const s1 = g.score1!, s2 = g.score2!
    map[g.team1].gf += s1; map[g.team1].ga += s2; map[g.team2].gf += s2; map[g.team2].ga += s1
    if (s1 > s2) { map[g.team1].w++; map[g.team1].pts += 3; map[g.team2].l++ }
    else if (s2 > s1) { map[g.team2].w++; map[g.team2].pts += 3; map[g.team1].l++ }
    else { map[g.team1].t++; map[g.team1].pts++; map[g.team2].t++; map[g.team2].pts++ }
  })
  const mp = (x: Standing) => x.w + x.l + x.t
  const h2h = (aT: string, bT: string) => {
    let aP = 0, bP = 0, aGd = 0
    scored.filter(g => (g.team1 === aT && g.team2 === bT) || (g.team1 === bT && g.team2 === aT)).forEach(g => {
      const aS = g.team1 === aT ? g.score1! : g.score2!, bS = g.team1 === aT ? g.score2! : g.score1!
      aGd += aS - bS; if (aS > bS) aP += 3; else if (bS > aS) bP += 3; else { aP++; bP++ }
    })
    return { aP, bP, aGd }
  }
  const cmp = (a: Standing, b: Standing) => {
    for (const tb of tbs) {
      let d = 0
      if (tb === 'record') d = b.pts - a.pts
      else if (tb === 'win_pct') d = (b.w + 0.5 * b.t) / Math.max(1, mp(b)) - (a.w + 0.5 * a.t) / Math.max(1, mp(a))
      else if (tb === 'goal_diff') d = (b.gf - b.ga) - (a.gf - a.ga)
      else if (tb === 'goals_for') d = b.gf - a.gf
      else if (tb === 'goals_against') d = a.ga - b.ga
      else if (tb === 'head_to_head' || tb === 'h2h_two') { const h = h2h(a.team, b.team); d = h.bP - h.aP }
      else if (tb === 'h2h_gd') { const h = h2h(a.team, b.team); d = -2 * h.aGd }
      if (d) return d
    }
    return 0
  }
  return Object.values(map).sort(cmp)
}
