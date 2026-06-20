import { prisma } from '@/lib/db'
import TournamentNav from '../TournamentNav'
import ChirpFaqSuggest from '@/components/ChirpFaqSuggest'
import { MessageCircleQuestion } from 'lucide-react'

export const dynamic = 'force-dynamic'

const norm = (q: string) => q.toLowerCase().trim().replace(/[?.!,]+$/g, '').replace(/\s+/g, ' ')
function ago(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function ChirpInsightsPage({ params }: { params: { id: string } }) {
  const [t, row] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: params.id } }).catch(() => null),
    prisma.appSetting.findUnique({ where: { key: `chirpLog:${params.id}` } }).catch(() => null),
  ])
  let log: { q: string; at: number; team?: string }[] = []
  try { const v = JSON.parse((row as any)?.value || '[]'); if (Array.isArray(v)) log = v } catch {}

  const counts = new Map<string, { q: string; n: number }>()
  for (const e of log) { const k = norm(e.q || ''); if (!k) continue; const c = counts.get(k); if (c) c.n++; else counts.set(k, { q: e.q, n: 1 }) }
  const top = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 10)
  const recent = [...log].reverse().slice(0, 60)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <TournamentNav id={params.id} name={(t as any)?.name || 'Tournament'} logoUrl={(t as any)?.logoUrl || ''} />

        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MessageCircleQuestion size={20} className="text-teal-600" /> Chirp insights</h1>
          <p className="text-sm text-slate-500 mt-1">What attendees are asking Chirp on your public pages. {log.length} question{log.length === 1 ? '' : 's'} so far.</p>
        </div>

        {log.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No questions yet. Once coaches and parents chat with Chirp on the event, register, schedule, or Today pages, their questions show up here.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Most asked</h2>
              <div className="space-y-1.5">
                {top.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-700">{r.q}</span>
                    <span className="shrink-0 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{r.n}×</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-1">Turn questions into a FAQ</h2>
              <p className="text-sm text-slate-500 mb-3">Let Chirp draft answers to the most common questions, then add the good ones to your event page.</p>
              <ChirpFaqSuggest tournamentId={params.id} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Recent questions</h2>
              <div className="space-y-2">
                {recent.map((e, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-700">{e.q}{e.team ? <span className="ml-2 text-[11px] text-slate-400">· {e.team}</span> : null}</span>
                    <span className="shrink-0 text-xs text-slate-400">{ago(e.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
