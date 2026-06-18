'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { calcStandings, Game } from '@/lib/standings'

// Live standings per division — links to the full public standings page.
export default function StandingsBlock() {
  const params = useParams() as any
  const id = params?.id
  const [games, setGames] = useState<Game[] | null>(null)
  useEffect(() => {
    if (!id) return
    fetch(`/api/tournaments/${id}/games`).then(r => r.ok ? r.json() : []).then(g => setGames(Array.isArray(g) ? g : [])).catch(() => setGames([]))
  }, [id])

  if (games === null) return <p className="text-sm text-slate-400">Loading standings…</p>
  const live = games.filter(g => !g.isCanceled)
  const divisions = Array.from(new Set(live.map(g => g.division).filter(Boolean))).sort() as string[]
  const blocks = divisions.map(d => ({ d, rows: calcStandings(live, d) })).filter(x => x.rows.length)
  if (!blocks.length) return <p className="text-sm text-slate-500">Standings appear here once games are scored.</p>

  return (
    <div className="space-y-5">
      {blocks.map(({ d, rows }) => (
        <div key={d}>
          <h3 className="font-bold text-slate-900 mb-2">{d}</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left font-medium px-3 py-1.5">Team</th>
                  <th className="font-medium px-2 py-1.5 w-10">W</th>
                  <th className="font-medium px-2 py-1.5 w-10">L</th>
                  <th className="font-medium px-2 py-1.5 w-10">T</th>
                  <th className="font-medium px-2 py-1.5 w-12">GD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.team} className={i % 2 ? 'bg-slate-50/40' : ''}>
                    <td className="px-3 py-1.5 text-slate-800">{s.team}</td>
                    <td className="text-center px-2 py-1.5">{s.w}</td>
                    <td className="text-center px-2 py-1.5">{s.l}</td>
                    <td className="text-center px-2 py-1.5">{s.t}</td>
                    <td className="text-center px-2 py-1.5">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <Link href={`/tournaments/${id}/public`} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900">Full standings &amp; tiebreakers <ArrowRight size={14} /></Link>
    </div>
  )
}
