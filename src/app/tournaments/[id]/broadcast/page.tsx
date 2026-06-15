'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { Megaphone, Send, TriangleAlert, Trash2, ChevronLeft, Globe, Layers, Star, Users, Shield } from 'lucide-react'

const AUD_TYPES: [string, string, any][] = [
  ['everyone', 'Everyone', Globe],
  ['division', 'Division', Layers],
  ['team', 'Team', Star],
  ['coaches', 'Coaches', Users],
  ['staff', 'Staff', Shield],
]

const TEMPLATES = [
  'Weather delay — all fields cleared for lightning. Shelter in vehicles; watch this page for the restart time.',
  'Play has resumed. Check your next game time on the schedule.',
  'Reminder: keep sidelines clear and stay behind the designated spectator areas.',
  'Championship photos at the main tent after each final.',
]

export default function BroadcastPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const role = (session?.user as any)?.role as string | undefined

  const [allowedRoles, setAllowedRoles] = useState<string[]>(['director', 'assigner'])
  const [divisions, setDivisions] = useState<string[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [type, setType] = useState<string>('everyone')
  const [div, setDiv] = useState('')
  const [team, setTeam] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)

  const canBroadcast = role === 'admin' || role === 'director' || (role ? allowedRoles.includes(role) : false)

  function loadAnnouncements() {
    fetch(`/api/tournaments/${id}/announcements`).then(r => r.ok ? r.json() : null).then(d => { if (d && Array.isArray(d.announcements)) setAnnouncements(d.announcements) }).catch(() => {})
  }

  useEffect(() => {
    if (!id) return
    fetch(`/api/tournaments/${id}/broadcast-roles`).then(r => r.ok ? r.json() : null).then(d => { if (d && Array.isArray(d.roles)) setAllowedRoles(d.roles) }).catch(() => {})
    fetch(`/api/tournaments/${id}/games`).then(r => r.ok ? r.json() : []).then(g => { if (Array.isArray(g)) setDivisions(Array.from(new Set(g.filter((x: any) => !x.isCanceled).map((x: any) => x.division))).sort() as string[]) }).catch(() => {})
    loadAnnouncements()
  }, [id])

  function scopeLabel(): string {
    if (type === 'division') return div || 'All divisions'
    if (type === 'team') return team ? `Team · ${team}` : 'Team'
    if (type === 'coaches') return 'Coaches'
    if (type === 'staff') return 'Staff'
    return 'Everyone'
  }
  const canSend = msg.trim() && !(type === 'team' && !team) && canBroadcast

  async function send() {
    setSending(true)
    try {
      const res = await fetch(`/api/tournaments/${id}/announcements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.trim(), scope: scopeLabel(), urgent }),
      })
      if (res.ok) { toast.success(`Sent to ${scopeLabel()}`); setMsg(''); setUrgent(false); loadAnnouncements() }
      else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Failed to send') }
    } catch { toast.error('Failed to send') } finally { setSending(false) }
  }

  async function remove(aid: string) {
    try {
      const res = await fetch(`/api/tournaments/${id}/announcements?id=${encodeURIComponent(aid)}`, { method: 'DELETE' })
      if (res.ok) loadAnnouncements(); else toast.error('Failed to remove')
    } catch { toast.error('Failed to remove') }
  }

  if (status === 'loading') return <div className="p-10 text-center text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <Link href={`/tournaments/${id}/dashboard`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700 mb-3"><ChevronLeft size={15} /> Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1"><Megaphone size={22} className="text-teal-600" /> Broadcast</h1>
      <p className="text-sm text-slate-500 mb-5">Post an announcement to the public schedule page. Pick who it’s for, then write the message.</p>

      {!canBroadcast && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
          Your role isn’t currently allowed to broadcast. The tournament director can enable it under Settings → Broadcast permissions.
        </div>
      )}

      <div className={canBroadcast ? '' : 'opacity-50 pointer-events-none'}>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Audience</label>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {AUD_TYPES.map(([key, label, Icon]) => (
            <button key={key} type="button" onClick={() => setType(key)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border ${type === key ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <Icon size={16} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3">
          {type === 'everyone' && <p className="text-xs text-slate-500">Goes to everyone following the event on the public page.</p>}
          {type === 'division' && (
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Division</label>
              <select value={div} onChange={e => setDiv(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All divisions</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          {type === 'team' && (
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Team name</label>
              <input value={team} onChange={e => setTeam(e.target.value)} placeholder="e.g. CocoTropics" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          )}
          {type === 'coaches' && <p className="text-xs text-slate-500">Tagged for coaches. (Targeted delivery to coach contacts comes with messaging; for now it posts to the public banner labeled “Coaches”.)</p>}
          {type === 'staff' && <p className="text-xs text-slate-500">Tagged for staff.</p>}
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1.5">Quick templates</label>
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
          {TEMPLATES.map((t, i) => (
            <button key={i} type="button" onClick={() => setMsg(t)} className="shrink-0 max-w-[220px] text-left text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 truncate hover:bg-slate-50">{t}</button>
          ))}
        </div>

        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="Type your announcement…"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3" />

        <button type="button" onClick={() => setUrgent(u => !u)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border mb-3 ${urgent ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><TriangleAlert size={15} className={urgent ? 'text-amber-500' : 'text-slate-400'} /> Mark urgent</span>
          <span className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${urgent ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'}`}><span className="w-4 h-4 rounded-full bg-white" /></span>
        </button>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 mb-3">
          <p className="text-[11px] text-slate-500">This goes to</p>
          <p className="text-sm font-bold text-slate-800">{scopeLabel()}</p>
        </div>

        <button type="button" onClick={send} disabled={!canSend || sending}
          className={`w-full py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2 ${canSend && !sending ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          <Send size={16} /> {sending ? 'Sending…' : 'Send broadcast'}
        </button>
      </div>

      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mt-8 mb-2">Recent broadcasts</h2>
      {announcements.length === 0 && <p className="text-sm text-slate-400">Nothing posted yet.</p>}
      <div className="space-y-2">
        {announcements.map((a: any) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${a.urgent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{a.urgent ? '● ' : ''}{a.scope}</span>
                <span className="text-[11px] text-slate-400">{new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-slate-700">{a.text}</p>
            </div>
            {canBroadcast && <button type="button" onClick={() => remove(a.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0" title="Remove"><Trash2 size={15} /></button>}
          </div>
        ))}
      </div>
    </div>
  )
}
