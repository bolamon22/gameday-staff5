'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { ClipboardCheck, ChevronLeft, Trash2, Check, Plus } from 'lucide-react'

type Item = { id: string; text: string; done: boolean; doneBy?: string; doneAt?: string }

export default function ChecklistPage() {
  const { id } = useParams()
  const { status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    fetch(`/api/tournaments/${id}/checklists`).then(r => r.ok ? r.json() : null).then(d => {
      if (d && Array.isArray(d.items)) setItems(d.items)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }
  useEffect(() => { if (id) load() }, [id])

  // Persist the full list; server stamps done-by and returns the cleaned list.
  async function save(next: Item[]) {
    setItems(next) // optimistic
    setSaving(true)
    try {
      const res = await fetch(`/api/tournaments/${id}/checklists`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next }),
      })
      if (res.ok) { const d = await res.json(); if (Array.isArray(d.items)) setItems(d.items) }
      else { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Failed to save'); load() }
    } catch { toast.error('Failed to save'); load() } finally { setSaving(false) }
  }

  function toggle(itemId: string) {
    save(items.map(i => i.id === itemId ? { ...i, done: !i.done } : i))
  }
  function remove(itemId: string) {
    save(items.filter(i => i.id !== itemId))
  }
  function add() {
    const text = newItem.trim()
    if (!text) return
    const item: Item = { id: Math.random().toString(36).slice(2, 10), text, done: false }
    setNewItem('')
    save([...items, item])
  }

  if (status === 'loading') return <div className="p-10 text-center text-gray-400">Loading…</div>

  const doneCount = items.filter(i => i.done).length
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <Link href={`/tournaments/${id}/dashboard`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700 mb-3"><ChevronLeft size={15} /> Dashboard</Link>
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1"><ClipboardCheck size={22} className="text-teal-600" /> Tournament setup checklist</h1>
      <p className="text-sm text-slate-500 mb-5">A shared setup list for the whole event. Anyone on staff can check items off and add their own.</p>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
        {/* progress */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-700">{doneCount} of {items.length} done</span>
          <span className="text-xs text-slate-400">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
        </div>

        {/* items */}
        <div className="space-y-2 mb-3">
          {loaded && items.length === 0 && <p className="text-sm text-slate-400 py-2">No items yet — add the first one below.</p>}
          {items.map(item => (
            <div key={item.id} className="group flex items-center gap-3">
              <button type="button" onClick={() => toggle(item.id)}
                className={`flex-1 flex items-center gap-3 p-2.5 rounded-xl border text-left ${item.done ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-teal-600 text-white' : 'bg-white border border-slate-300 text-transparent'}`}><Check size={14} /></span>
                <span className="min-w-0">
                  <span className={`block text-sm ${item.done ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{item.text}</span>
                  {item.done && item.doneBy && (
                    <span className="block text-[11px] text-slate-400">{item.doneBy}{item.doneAt ? ` · ${new Date(item.doneAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span>
                  )}
                </span>
              </button>
              <button type="button" onClick={() => remove(item.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove item"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>

        {/* add item */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }}
            placeholder="Add a setup item…" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button type="button" onClick={add} disabled={!newItem.trim() || saving}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm ${newItem.trim() && !saving ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Plus size={16} /> Add</button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">Changes save automatically and are shared with everyone on staff.</p>
    </div>
  )
}
