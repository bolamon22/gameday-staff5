'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { ClipboardCheck, ChevronLeft, Trash2, Check } from 'lucide-react'

const ITEMS = [
  'Goals & nets secured',
  'Field lines visible',
  'Trash & benches cleared',
  'First-aid kit on field',
  'Water station stocked',
  'Scoreboard / clock working',
]

export default function ChecklistPage() {
  const { id } = useParams()
  const { status } = useSession()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [field, setField] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    fetch(`/api/tournaments/${id}/checklists`).then(r => r.ok ? r.json() : null).then(d => { if (d && Array.isArray(d.submissions)) setSubmissions(d.submissions) }).catch(() => {})
  }
  useEffect(() => { if (id) load() }, [id])

  const checkedCount = Object.values(checks).filter(Boolean).length
  const canSubmit = field.trim() && !saving

  async function submit() {
    if (!field.trim()) return
    setSaving(true)
    try {
      const items: Record<string, boolean> = {}
      ITEMS.forEach(i => { items[i] = !!checks[i] })
      const res = await fetch(`/api/tournaments/${id}/checklists`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: field.trim(), items, note: note.trim() }),
      })
      if (res.ok) { toast.success(`Field ${field.trim()} checklist submitted`); setField(''); setChecks({}); setNote(''); load() }
      else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Failed') }
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }
  async function remove(sid: string) {
    try { const r = await fetch(`/api/tournaments/${id}/checklists?id=${encodeURIComponent(sid)}`, { method: 'DELETE' }); if (r.ok) load() } catch {}
  }

  if (status === 'loading') return <div className="p-10 text-center text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <Link href={`/tournaments/${id}/dashboard`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700 mb-3"><ChevronLeft size={15} /> Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1"><ClipboardCheck size={22} className="text-teal-600" /> Field checklist</h1>
      <p className="text-sm text-slate-500 mb-5">Run through a field before play and submit when it’s ready.</p>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
        <label className="block text-[11px] text-slate-500 mb-1">Field</label>
        <input value={field} onChange={e => setField(e.target.value)} placeholder="e.g. Field 5" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <div className="space-y-2 mb-3">
          {ITEMS.map(item => {
            const on = !!checks[item]
            return (
              <button key={item} type="button" onClick={() => setChecks(c => ({ ...c, [item]: !c[item] }))}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left ${on ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-transparent'}`}>
                <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${on ? 'bg-teal-600 text-white' : 'bg-white border border-slate-300 text-transparent'}`}><Check size={14} /></span>
                <span className={`text-sm ${on ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{item}</span>
              </button>
            )
          })}
        </div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button type="button" onClick={submit} disabled={!canSubmit}
          className={`w-full py-2.5 rounded-xl font-bold ${canSubmit ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{saving ? 'Submitting…' : `Submit checklist (${checkedCount}/${ITEMS.length})`}</button>
      </div>

      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Recent submissions</h2>
      {submissions.length === 0 && <p className="text-sm text-slate-400">No checklists submitted yet.</p>}
      <div className="space-y-2">
        {submissions.map(s => {
          const complete = s.total > 0 && s.checked === s.total
          return (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{s.field}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${complete ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>{s.checked}/{s.total} {complete ? 'ready' : 'partial'}</span>
                </div>
                <p className="text-[11px] text-slate-400">{s.by} · {new Date(s.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{s.note ? ` · ${s.note}` : ''}</p>
              </div>
              <button type="button" onClick={() => remove(s.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0" title="Delete"><Trash2 size={14} /></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
