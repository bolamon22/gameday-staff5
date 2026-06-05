// Bracket template definitions for single/double elimination

export interface GameTemplate {
  gameNumber: number
  round: number
  section: 'winners' | 'losers' | 'championship'
  t1: string   // 'seed:N', 'winner:N', 'loser:N'
  t2: string
  label?: string
}

// ── Single Elimination ──────────────────────────────────────────────

const SE4: GameTemplate[] = [
  { gameNumber: 1, round: 1, section: 'winners', t1: 'seed:1', t2: 'seed:4' },
  { gameNumber: 2, round: 1, section: 'winners', t1: 'seed:2', t2: 'seed:3' },
  { gameNumber: 3, round: 2, section: 'championship', t1: 'winner:1', t2: 'winner:2', label: 'Championship' },
]

const SE8: GameTemplate[] = [
  { gameNumber: 1, round: 1, section: 'winners', t1: 'seed:1', t2: 'seed:8' },
  { gameNumber: 2, round: 1, section: 'winners', t1: 'seed:4', t2: 'seed:5' },
  { gameNumber: 3, round: 1, section: 'winners', t1: 'seed:2', t2: 'seed:7' },
  { gameNumber: 4, round: 1, section: 'winners', t1: 'seed:3', t2: 'seed:6' },
  { gameNumber: 5, round: 2, section: 'winners', t1: 'winner:1', t2: 'winner:2' },
  { gameNumber: 6, round: 2, section: 'winners', t1: 'winner:3', t2: 'winner:4' },
  { gameNumber: 7, round: 3, section: 'championship', t1: 'winner:5', t2: 'winner:6', label: 'Championship' },
]

const SE16: GameTemplate[] = [
  { gameNumber: 1,  round: 1, section: 'winners', t1: 'seed:1',  t2: 'seed:16' },
  { gameNumber: 2,  round: 1, section: 'winners', t1: 'seed:8',  t2: 'seed:9'  },
  { gameNumber: 3,  round: 1, section: 'winners', t1: 'seed:4',  t2: 'seed:13' },
  { gameNumber: 4,  round: 1, section: 'winners', t1: 'seed:5',  t2: 'seed:12' },
  { gameNumber: 5,  round: 1, section: 'winners', t1: 'seed:2',  t2: 'seed:15' },
  { gameNumber: 6,  round: 1, section: 'winners', t1: 'seed:7',  t2: 'seed:10' },
  { gameNumber: 7,  round: 1, section: 'winners', t1: 'seed:3',  t2: 'seed:14' },
  { gameNumber: 8,  round: 1, section: 'winners', t1: 'seed:6',  t2: 'seed:11' },
  { gameNumber: 9,  round: 2, section: 'winners', t1: 'winner:1', t2: 'winner:2' },
  { gameNumber: 10, round: 2, section: 'winners', t1: 'winner:3', t2: 'winner:4' },
  { gameNumber: 11, round: 2, section: 'winners', t1: 'winner:5', t2: 'winner:6' },
  { gameNumber: 12, round: 2, section: 'winners', t1: 'winner:7', t2: 'winner:8' },
  { gameNumber: 13, round: 3, section: 'winners', t1: 'winner:9',  t2: 'winner:10' },
  { gameNumber: 14, round: 3, section: 'winners', t1: 'winner:11', t2: 'winner:12' },
  { gameNumber: 15, round: 4, section: 'championship', t1: 'winner:13', t2: 'winner:14', label: 'Championship' },
]

// ── Double Elimination ──────────────────────────────────────────────

const DE4: GameTemplate[] = [
  { gameNumber: 1, round: 1, section: 'winners', t1: 'seed:1', t2: 'seed:4' },
  { gameNumber: 2, round: 1, section: 'winners', t1: 'seed:2', t2: 'seed:3' },
  { gameNumber: 3, round: 2, section: 'winners', t1: 'winner:1', t2: 'winner:2', label: "Winners' Final" },
  { gameNumber: 4, round: 2, section: 'losers', t1: 'loser:1', t2: 'loser:2' },
  { gameNumber: 5, round: 3, section: 'losers', t1: 'loser:3', t2: 'winner:4', label: "Losers' Final" },
  { gameNumber: 6, round: 4, section: 'championship', t1: 'winner:3', t2: 'winner:5', label: 'Championship' },
]

const DE8: GameTemplate[] = [
  { gameNumber: 1, round: 1, section: 'winners', t1: 'seed:1', t2: 'seed:8' },
  { gameNumber: 2, round: 1, section: 'winners', t1: 'seed:4', t2: 'seed:5' },
  { gameNumber: 3, round: 1, section: 'winners', t1: 'seed:2', t2: 'seed:7' },
  { gameNumber: 4, round: 1, section: 'winners', t1: 'seed:3', t2: 'seed:6' },
  { gameNumber: 5, round: 2, section: 'winners', t1: 'winner:1', t2: 'winner:2' },
  { gameNumber: 6, round: 2, section: 'winners', t1: 'winner:3', t2: 'winner:4' },
  { gameNumber: 7, round: 3, section: 'winners', t1: 'winner:5', t2: 'winner:6', label: "Winners' Final" },
  { gameNumber: 8,  round: 2, section: 'losers', t1: 'loser:1', t2: 'loser:2' },
  { gameNumber: 9,  round: 2, section: 'losers', t1: 'loser:3', t2: 'loser:4' },
  { gameNumber: 10, round: 3, section: 'losers', t1: 'loser:5', t2: 'winner:8'  },
  { gameNumber: 11, round: 3, section: 'losers', t1: 'loser:6', t2: 'winner:9'  },
  { gameNumber: 12, round: 4, section: 'losers', t1: 'winner:10', t2: 'winner:11' },
  { gameNumber: 13, round: 5, section: 'losers', t1: 'loser:7', t2: 'winner:12', label: "Losers' Final" },
  { gameNumber: 14, round: 6, section: 'championship', t1: 'winner:7', t2: 'winner:13', label: 'Championship' },
]

export const BRACKET_TEMPLATES: Record<string, GameTemplate[]> = {
  'single-4':  SE4,
  'single-8':  SE8,
  'single-16': SE16,
  'double-4':  DE4,
  'double-8':  DE8,
}

export function getTemplate(format: string, teamCount: number): GameTemplate[] | null {
  return BRACKET_TEMPLATES[`${format}-${teamCount}`] ?? null
}

export function resolveTeam(
  source: string,
  seeds: Record<string, string>,
  games: Array<{ gameNumber: number; winner: string; loser: string }>
): string {
  if (!source) return ''
  const [type, ref] = source.split(':')
  const n = parseInt(ref)
  if (type === 'seed') return seeds[String(n)] || `Seed ${n}`
  if (type === 'winner') return games.find(g => g.gameNumber === n)?.winner || ''
  if (type === 'loser')  return games.find(g => g.gameNumber === n)?.loser  || ''
  return ''
}
