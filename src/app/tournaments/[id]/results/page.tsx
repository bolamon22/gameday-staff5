'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, BarChart3, ClipboardList, Medal } from 'lucide-react'

interface Game {
  id: string; gameNumber: string; date: string; startTime: string
  division: string; team1: string; team2: string
  score1: number | null; score2: number | null
  isCanceled: boolean; isChampionship: boolean
}
interface TeamStat {
  team: string; w: number; l: number; t: number
  gf: number; ga: number; pts: number; gamesPlayed: number
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function PublicResultsPage({ params }: { params: { id: string } }) {
  const [tournament, setTournament] = useState<{ name: string; logoUrl: string } | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selDiv, setSelDiv] = useState('')
  const [tab, setTab] = useState<'standings' | 'scores'>('standings')
  const [logos, setLogos] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournaments/${params.id}`).then(r => r.json()),
      fetch(`/api/tournaments/${params.id}/games`).then(r => r.json()),
      fetch(`/api/tournaments/${params.id}/team-logos`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([t, g, lg]) => {
      setTournament(t)
      setGames(g)
      setLogos(lg || {})
      const divs = [...new Set((g as Game[]).map(x => x.division))].sort()
      if (divs.length) setSelDiv(divs[0])
      setLoading(false)
    })
  }, [params.id])

  const divisions = [...new Set(games.map(g => g.division))].sort()
  const scored = games.filter(g => !g.isCanceled && g.score1 != null && g.score2 != null)
  const divGames = scored.filter(g => !selDiv || g.division === selDiv)

  // Build standings for selected division
  function buildStandings(divName: string): TeamStat[] {
    const map = new Map<string, TeamStat>()
    const ensure = (team: string) => {
      if (!map.has(team)) map.set(team, { team, w: 0, l: 0, t: 0, gf: 0, ga: 0, pts: 0, gamesPlayed: 0 })
      return map.get(team)!
    }
    scored.filter(g => g.division === divName && !g.isChampionship).forEach(g => {
      const t1 = ensure(g.team1); const t2 = ensure(g.team2)
      t1.gf += g.score1!; t1.ga += g.score2!; t1.gamesPlayed++
      t2.gf += g.score2!; t2.ga += g.score1!; t2.gamesPlayed++
      if (g.score1! > g.score2!) { t1.w++; t1.pts += 3; t2.l++ }
      else if (g.score2! > g.score1!) { t2.w++; t2.pts += 3; t1.l++ }
      else { t1.t++; t1.pts += 1; t2.t++; t2.pts += 1 }
    })
    return [...map.values()].sort((a, b) =>
      b.pts !== a.pts ? b.pts - a.pts :
      (b.gf - b.ga) !== (a.gf - a.ga) ? (b.gf - b.ga) - (a.gf - a.ga) :
      b.gf - a.gf
    )
  }

  // Recent scored games (all divisions, latest first)
  const recentScored = [...scored]
    .sort((a, b) => `${b.date}${b.startTime}` < `${a.date}${a.startTime}` ? 1 : -1)
    .slice(0, 30)

  // Championship games
  const championships = scored.filter(g => g.isChampionship)

  function renderLogo(name: string, size = 18) {
    const url = logos[name]
    if (url) return <img src={url} alt="" className="rounded object-contain bg-white border border-slate-200 inline-block align-middle" style={{ width: size, height: size }} />
    return <span className="rounded bg-slate-100 border border-slate-200 text-slate-400 font-semibold inline-flex items-center justify-center align-middle" style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}>{(name || '?').charAt(0).toUpperCase()}</span>
  }

  if (loading) return <div className="p-10 text-center text-slate-400">Loading…</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tournament?.logoUrl && <img src={tournament.logoUrl} alt="logo" className="h-12 w-12 object-contain rounded-xl" />}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{tournament?.name}</h1>
              <p className="text-sm text-slate-400">Results & standings</p>
            </div>
          </div>
          <Link href={`/tournaments/${params.id}/public`}
            className="text-sm text-teal-600 hover:underline">← Schedule</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">

        {/* Championship callout */}
        {championships.length > 0 && (
          <div className="mb-6 space-y-2">
            {championships.map(g => {
              const winner = g.score1! > g.score2! ? g.team1 : g.score2! > g.score1! ? g.team2 : null
              return (
                <div key={g.id} className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4">
                  <Trophy size={24} className="text-amber-500" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5">{g.division} — Championship</p>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {winner && renderLogo(winner, 18)}
                      {winner ? <>{winner} wins!</> : 'Draw'}
                    </p>
                    <p className="text-xs text-slate-500">{g.team1} {g.score1} – {g.score2} {g.team2}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['standings','scores'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize inline-flex items-center gap-1.5 ${tab === t ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t === 'standings' ? <><BarChart3 size={14} /> Standings</> : <><ClipboardList size={14} /> Scores</>}
            </button>
          ))}
        </div>

        {/* Division selector */}
        {tab === 'standings' && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {divisions.map(d => (
              <button key={d} onClick={() => setSelDiv(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selDiv === d ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Standings table */}
        {tab === 'standings' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {selDiv ? (
              <>
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">{selDiv}</p>
                </div>
                {(() => {
                  const standings = buildStandings(selDiv)
                  if (standings.length === 0) return (
                    <div className="px-5 py-10 text-center text-slate-400 text-sm">No scored games yet.</div>
                  )
                  return (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Team</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">GP</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">W</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">L</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">T</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">GF</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">GA</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 font-bold">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {standings.map((s, i) => (
                          <tr key={s.team} className={i === 0 ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}>
                            <td className="px-5 py-3 font-medium text-slate-800">
                              {i === 0 && <Medal size={14} className="inline mr-1.5 text-amber-500" />}
                              {i === 1 && <Medal size={14} className="inline mr-1.5 text-slate-400" />}
                              {i === 2 && <Medal size={14} className="inline mr-1.5 text-amber-700" />}
                              {renderLogo(s.team, 18)}<span className="ml-2 align-middle">{s.team}</span>
                            </td>
                            <td className="text-center px-3 py-3 text-slate-500">{s.gamesPlayed}</td>
                            <td className="text-center px-3 py-3 font-semibold text-emerald-600">{s.w}</td>
                            <td className="text-center px-3 py-3 text-red-500">{s.l}</td>
                            <td className="text-center px-3 py-3 text-slate-500">{s.t}</td>
                            <td className="text-center px-3 py-3 text-slate-500">{s.gf}</td>
                            <td className="text-center px-3 py-3 text-slate-500">{s.ga}</td>
                            <td className="text-center px-3 py-3 font-bold text-slate-800">{s.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                })()}
              </>
            ) : (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">Select a division above.</div>
            )}
          </div>
        )}

        {/* Scores tab */}
        {tab === 'scores' && (
          <div className="space-y-4">
            {recentScored.length === 0 && <div className="text-center py-12 text-slate-400">No scores posted yet.</div>}
            {/* Group by date */}
            {[...new Set(recentScored.map(g => g.date))].map(date => (
              <div key={date}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{fmtDate(date)}</p>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
                  {recentScored.filter(g => g.date === date).map(g => {
                    const t1wins = g.score1! > g.score2!
                    const t2wins = g.score2! > g.score1!
                    return (
                      <div key={g.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-14 flex-shrink-0">{fmt12(g.startTime)}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <span className={`flex-1 text-sm text-right ${t1wins ? 'font-bold text-slate-900' : 'text-slate-600'}`}><span className="inline-flex items-center gap-1.5 justify-end">{g.team1} {renderLogo(g.team1, 16)}</span></span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${t1wins ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{g.score1}</span>
                            <span className="text-slate-300 text-xs">–</span>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${t2wins ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{g.score2}</span>
                          </div>
                          <span className={`flex-1 text-sm ${t2wins ? 'font-bold text-slate-900' : 'text-slate-600'}`}><span className="inline-flex items-center gap-1.5">{renderLogo(g.team2, 16)} {g.team2}</span></span>
                        </div>
                        <span className="text-xs text-slate-400 w-24 text-right truncate">{g.division}</span>
                        {g.isChampionship && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0"><Trophy size={11} /></span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
