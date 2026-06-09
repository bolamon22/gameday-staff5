'use client'

import OrgLogoMark from '@/app/OrgLogoMark'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

type Status = 'todo' | 'in-progress' | 'done'

interface RoadmapItem {
  id: string
  num: number
  title: string
  description: string
  status: Status
  notes: string
  estimate: string
  createdAt: string
}

interface Subtask {
  id: string
  itemId: string
  title: string
  completed: number
  createdAt: string
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  'todo':        { label: 'To Do',       color: 'bg-slate-100 text-slate-600 border-slate-200' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'done':        { label: 'Done',        color: 'bg-green-100 text-green-700 border-green-200' },
}

export default function RoadmapPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimate, setEstimate] = useState('')
  const [adding, setAdding] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [filterTime, setFilterTime] = useState<'all' | 'quick' | 'medium' | 'big'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'num' | 'az' | 'status'>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editEstimate, setEditEstimate] = useState('')
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Subtask[]>>({})
  const [newSubtask, setNewSubtask] = useState<Record<string, string>>({})
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const notesSaveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'admin') { router.replace('/'); return }
    fetch('/api/admin/roadmap')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data)
          const nm: Record<string, string> = {}
          data.forEach((i: RoadmapItem) => { nm[i.id] = i.notes ?? '' })
          setNotesMap(nm)
        }
        setLoading(false)
      })
  }, [session, status])

  useEffect(() => {
    if (!statusDropdown) return
    const close = () => setStatusDropdown(null)
    document.addEventListener('click', close, true)
    return () => document.removeEventListener('click', close, true)
  }, [statusDropdown])

  async function loadSubtasks(itemId: string) {
    if (subtasksMap[itemId]) return
    const res = await fetch(`/api/admin/roadmap/${itemId}/subtasks`)
    const data = await res.json()
    setSubtasksMap(prev => ({ ...prev, [itemId]: Array.isArray(data) ? data : [] }))
  }

  function toggleExpand(itemId: string) {
    if (expandedId === itemId) {
      setExpandedId(null)
    } else {
      setExpandedId(itemId)
      loadSubtasks(itemId)
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, estimate }),
    })
    const item = await res.json()
    setItems(prev => [item, ...prev])
    setNotesMap(prev => ({ ...prev, [item.id]: '' }))
    setTitle(''); setDescription(''); setEstimate('')
    toast.success('Item added')
    setAdding(false)
  }

  async function setStatus(item: RoadmapItem, next: Status) {
    setStatusDropdown(null)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: next } : i))
    await fetch(`/api/admin/roadmap/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item and all its subtasks?')) return
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/admin/roadmap/${id}`, { method: 'DELETE' })
    toast.success('Deleted')
  }

  async function saveEdit(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, title: editTitle, description: editDesc, estimate: editEstimate } : i))
    setEditingId(null)
    await fetch(`/api/admin/roadmap/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDesc, estimate: editEstimate }),
    })
    toast.success('Saved')
  }

  function handleNotesChange(itemId: string, value: string) {
    setNotesMap(prev => ({ ...prev, [itemId]: value }))
    clearTimeout(notesSaveTimer.current[itemId])
    notesSaveTimer.current[itemId] = setTimeout(() => {
      fetch(`/api/admin/roadmap/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      })
    }, 800)
  }

  async function addSubtask(itemId: string) {
    const text = (newSubtask[itemId] ?? '').trim()
    if (!text) return
    const res = await fetch(`/api/admin/roadmap/${itemId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: text }),
    })
    const sub = await res.json()
    setSubtasksMap(prev => ({ ...prev, [itemId]: [...(prev[itemId] ?? []), sub] }))
    setNewSubtask(prev => ({ ...prev, [itemId]: '' }))
  }

  async function toggleSubtask(itemId: string, sub: Subtask) {
    const next = sub.completed ? 0 : 1
    setSubtasksMap(prev => ({
      ...prev,
      [itemId]: prev[itemId].map(s => s.id === sub.id ? { ...s, completed: next } : s),
    }))
    await fetch(`/api/admin/roadmap/${itemId}/subtasks/${sub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: next === 1 }),
    })
  }

  async function deleteSubtask(itemId: string, subId: string) {
    setSubtasksMap(prev => ({ ...prev, [itemId]: prev[itemId].filter(s => s.id !== subId) }))
    await fetch(`/api/admin/roadmap/${itemId}/subtasks/${subId}`, { method: 'DELETE' })
  }

  const counts = { todo: 0, 'in-progress': 0, done: 0 }
  items.forEach(i => { counts[i.status]++ })
  const statusOrder: Record<Status, number> = { 'in-progress': 0, 'todo': 1, 'done': 2 }
  const timeFilterFn = (item: RoadmapItem) => {
    if (filterTime === 'all') return true
    const e = (item.estimate || '').toLowerCase()
    if (!e) return filterTime === 'all'
    // parse out the largest number mentioned
    const nums = e.match(/[\d.]+/g)?.map(Number) || []
    const max = nums.length ? Math.max(...nums) : 0
    const isHours = e.includes('hr') || e.includes('hour')
    const minutes = isHours ? max * 60 : max
    if (filterTime === 'quick') return minutes <= 60
    if (filterTime === 'medium') return minutes > 60 && minutes <= 120
    if (filterTime === 'big') return minutes > 120
    return true
  }
  const filtered = (filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus))
    .filter(timeFilterFn)
    .filter(i => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return i.title.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q) || String(i.num ?? '').includes(q)
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'num') return (a.num ?? 0) - (b.num ?? 0)
      if (sortBy === 'az') return a.title.localeCompare(b.title)
      if (sortBy === 'status') return statusOrder[a.status] - statusOrder[b.status]
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // newest
    })

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">← Admin</Link>
            </div>
            <div className="flex items-center gap-3"><OrgLogoMark /><h1 className="text-xl font-bold text-slate-900">Feature Roadmap</h1></div>
            <p className="text-sm text-slate-500">Internal feature request &amp; tracking board</p>
          </div>
          <div className="flex gap-2 text-xs">
            {(['todo', 'in-progress', 'done'] as Status[]).map(s => (
              <span key={s} className={`px-2 py-1 rounded-full border font-medium ${STATUS_CONFIG[s].color}`}>
                {STATUS_CONFIG[s].label}: {counts[s]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* Add form */}
        <form onSubmit={addItem} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Feature Request</h2>
          <input
            type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <input
            type="text" placeholder="Estimate (e.g. 1 hr, 30 min, 2-3 hrs)" value={estimate} onChange={e => setEstimate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={adding || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-colors">
            {adding ? 'Adding…' : '+ Add Item'}
          </button>
        </form>

        {/* Filter + Sort bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'todo', 'in-progress', 'done'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  filterStatus === s
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {s === 'all' ? `All (${items.length})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="num">By # number</option>
              <option value="az">A → Z</option>
              <option value="status">By status</option>
            </select>
          </div>
        </div>

        {/* Time filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Time:</span>
          {([
            { key: 'all', label: 'All' },
            { key: 'quick', label: '⚡ Quick (≤1 hr)' },
            { key: 'medium', label: '🔧 Medium (1-2 hrs)' },
            { key: 'big', label: '🏗 Big (2+ hrs)' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setFilterTime(key)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                filterTime === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Items list */}
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-12">No items yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const subs = subtasksMap[item.id] ?? []
              const doneSubs = subs.filter(s => s.completed).length
              const isExpanded = expandedId === item.id
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item.id)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Card header */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-400 font-medium">#{item.num}</span>
                            <span className="font-semibold text-slate-800 text-sm">{item.title}</span>
                            {item.estimate && (
                              <span className="text-xs text-slate-400 font-normal">({item.estimate})</span>
                            )}
                            {/* Status dropdown */}
                            <div className="relative" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setStatusDropdown(statusDropdown === item.id ? null : item.id)}
                                className={`text-[11px] px-2 py-0.5 rounded-full border font-medium cursor-pointer hover:opacity-80 transition-opacity ${STATUS_CONFIG[item.status].color}`}>
                                {STATUS_CONFIG[item.status].label} ▾
                              </button>
                              {statusDropdown === item.id && (
                                <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden text-xs min-w-[130px]">
                                  {(['todo', 'in-progress', 'done'] as Status[]).map(s => (
                                    <button key={s} onClick={() => setStatus(item, s)}
                                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 ${item.status === s ? 'font-semibold' : ''}`}>
                                      <span className={`inline-block w-2 h-2 rounded-full ${s === 'todo' ? 'bg-slate-400' : s === 'in-progress' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                      {STATUS_CONFIG[s].label}
                                      {item.status === s && ' ✓'}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-xs text-slate-400">
                              Added {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {/* Subtask progress pill (only if subtasks loaded) */}
                            {subtasksMap[item.id] && subs.length > 0 && (
                              <span className="text-xs text-slate-400">{doneSubs}/{subs.length} subtasks</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 items-center">
                          <button onClick={() => toggleExpand(item.id)}
                            className="text-xs text-slate-400 hover:text-blue-600 px-2 py-1 rounded transition-colors font-medium"
                            title="Notes & Subtasks">
                            {isExpanded ? '▲ Less' : '▼ Notes & Subtasks'}
                          </button>
                          <button onClick={() => { setEditingId(item.id); setEditTitle(item.title); setEditDesc(item.description); setEditEstimate(item.estimate ?? '') }}
                            className="text-slate-400 hover:text-slate-600 text-sm px-1.5 py-1 rounded" title="Edit">✏️</button>
                          <button onClick={() => deleteItem(item.id)}
                            className="text-slate-400 hover:text-red-500 text-sm px-1.5 py-1 rounded" title="Delete">🗑</button>
                        </div>
                      </div>

                      {/* Expanded: notes + subtasks */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">

                          {/* Notes */}
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Notes</label>
                            <textarea
                              value={notesMap[item.id] ?? ''}
                              onChange={e => handleNotesChange(item.id, e.target.value)}
                              rows={3}
                              placeholder="Add notes, links, context…"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700 placeholder-slate-300"
                            />
                            <p className="text-xs text-slate-400 mt-0.5">Auto-saves as you type</p>
                          </div>

                          {/* Subtasks */}
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Subtasks</label>
                            {subs.length > 0 && (
                              <ul className="space-y-1 mb-2">
                                {subs.map(sub => (
                                  <li key={sub.id} className="flex items-center gap-2 group">
                                    <input type="checkbox" checked={!!sub.completed} onChange={() => toggleSubtask(item.id, sub)}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                    <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                      {sub.title}
                                    </span>
                                    <button onClick={() => deleteSubtask(item.id, sub.id)}
                                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 text-xs transition-opacity">✕</button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {/* Add subtask */}
                            <div className="flex gap-2">
                              <input
                                value={newSubtask[item.id] ?? ''}
                                onChange={e => setNewSubtask(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(item.id) } }}
                                placeholder="Add subtask…"
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button onClick={() => addSubtask(item.id)}
                                disabled={!(newSubtask[item.id] ?? '').trim()}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors">
                                + Add
                              </button>
                            </div>
                          </div>

                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
