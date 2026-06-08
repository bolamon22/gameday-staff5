'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import TournamentNav from '../TournamentNav'

interface Tournament { id: string; name: string; startDate: string }
interface Club {
  id: string
  clubName: string
  contactName: string
  contactEmail: string
  numTeams: number
  divisions: string[]
  registered: boolean
}

export default function ReturningTeamsPage({ params }: { params: { id: string } }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [sourceId, setSourceId] = useState('')
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'registered' | 'not-registered'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [tName, setTName] = useState('')

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then((all: Tournament[]) => {
      setTournaments(all.filter(t => t.id !== params.id))
    })
    fetch(`/api/tournaments/${params.id}`).then(r => r.json()).then(t => setTName(t.name))
  }, [params.id])

  async function loadComparison(fromId: string) {
    if (!fromId) { setClubs([]); return }
    setLoading(true)
    setSelected(new Set())
    const res = await fetch(`/api/tournaments/${params.id}/returning-teams?from=${fromId}`)
    const data = await res.json()
    setClubs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function toggleSelect(clubName: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(clubName) ? s.delete(clubName) : s.add(clubName)
      return s
    })
  }

  function selectAllUnregistered() {
    const unregd = clubs.filter(c => !c.registered).map(c => c.clubName)
    setSelected(new Set(unregd))
  }

  async function sendInvites() {
    const toSend = clubs.filter(c => selected.has(c.clubName) && !c.registered)
    if (!toSend.length) { toast.error('No unregistered clubs selected'); return }
    setSending(true)
    const res = await fetch(`/api/tournaments/${params.id}/returning-teams/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubs: toSend.map(c => ({ clubName: c.clubName, contactEmail: c.contactEmail, contactName: c.contactName })) }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Sent ${data.sent} invite${data.sent !== 1 ? 's' : ''}${data.errors?.length ? ` (${data.errors.length} failed)` : ''}`)
      setSelected(new Set())
    } else {
      toast.error('Failed to send invites')
    }
    setSending(false)
  }

  const filtered = clubs.filter(c =>
    filter === 'all' ? true : filter === 'registered' ? c.registered : !c.registered
  )
  const unregisteredCount = clubs.filter(c => !c.registered).length
  const registeredCount = clubs.filter(c => c.registered).length
  const selectedUnregistered = clubs.filter(c => selected.has(c.clubName) && !c.registered)

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Toaster />
      <TournamentNav id={params.id} name={tName} />

      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Returning Teams</h1>
            <p className="text-sm text-slate-500 mt-0.5">Compare registrations from a previous tournament and invite clubs back</p>
          </div>
          <Link href={`/tournaments/${params.id}/registrations`} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
            ← Registrations
          </Link>
        </div>

        {/* Source picker */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Compare against which tournament?</label>
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            value={sourceId}
            onChange={e => { setSourceId(e.target.value); loadComparison(e.target.value) }}
          >
            <option value="">— Select a previous tournament —</option>
            {tournaments.sort((a, b) => b.startDate.localeCompare(a.startDate)).map(t => (
              <option key={t.id} value={t.id}>{t.name}{t.startDate ? ` (${t.startDate})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-16 text-slate-400">Loading…</div>
        )}

        {!loading && sourceId && clubs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No team registrations found in that tournament.
          </div>
        )}

        {!loading && clubs.length > 0 && (
          <>
            {/* Summary + actions bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-sm flex-1">
                <span className="font-semibold text-slate-800">{clubs.length} clubs</span>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-600 font-semibold">✓ {registeredCount} back</span>
                <span className="text-slate-300">·</span>
                <span className="text-amber-600 font-semibold">✗ {unregisteredCount} not yet</span>
              </div>
              <div className="flex items-center gap-2">
                {(['all', 'registered', 'not-registered'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                    {f === 'all' ? 'All' : f === 'registered' ? '✓ Registered' : '✗ Not Yet'}
                  </button>
                ))}
              </div>
            </div>

            {/* Invite bar — shows when clubs selected */}
            {unregisteredCount > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap">
                <button onClick={selectAllUnregistered} className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2">
                  Select all {unregisteredCount} unregistered
                </button>
                {selected.size > 0 && <span className="text-xs text-slate-500">{selected.size} selected ({selectedUnregistered.length} unregistered)</span>}
                <div className="flex-1" />
                <button
                  onClick={sendInvites}
                  disabled={selectedUnregistered.length === 0 || sending}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  {sending ? 'Sending…' : `✉ Send Invite${selectedUnregistered.length !== 1 ? 's' : ''} (${selectedUnregistered.length})`}
                </button>
              </div>
            )}

            {/* Club list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-10 px-4 py-3" />
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Club</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Divisions</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Teams</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(club => (
                    <tr key={club.id} className={`hover:bg-slate-50 transition-colors ${club.registered ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        {!club.registered && (
                          <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer"
                            checked={selected.has(club.clubName)}
                            onChange={() => toggleSelect(club.clubName)} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{club.clubName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{club.contactName}</div>
                        <div className="text-slate-400 text-xs">{club.contactEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {club.divisions.slice(0, 3).map(d => (
                            <span key={d} className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{d}</span>
                          ))}
                          {club.divisions.length > 3 && <span className="text-[11px] text-slate-400">+{club.divisions.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{club.numTeams}</td>
                      <td className="px-4 py-3">
                        {club.registered
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Registered</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Not yet</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
