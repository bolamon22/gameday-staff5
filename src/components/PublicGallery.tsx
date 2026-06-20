'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Share2, Check, Camera } from 'lucide-react'

type Photo = { id?: string; url: string; caption?: string; credit?: string; tournamentId?: string }
type Tourn = { id: string; name: string }

// Public photo gallery: tournament filter bar, click-to-expand lightbox (prev/next +
// keyboard), photo credits, and per-photo share (deep link ?photo=id + native share).
export default function PublicGallery({ photos, tournaments }: { photos: Photo[]; tournaments: Tourn[] }) {
  const nameOf = useMemo(() => { const m: Record<string, string> = {}; tournaments.forEach(t => { m[t.id] = t.name }); return m }, [tournaments])

  const cats = useMemo(() => {
    const ids = new Set<string>()
    let hasOther = false
    photos.forEach(p => { const tid = p.tournamentId || ''; if (tid && nameOf[tid]) ids.add(tid); else hasOther = true })
    return { list: tournaments.filter(t => ids.has(t.id)), hasOther }
  }, [photos, tournaments, nameOf])

  const [filter, setFilter] = useState<string>('all')
  const [active, setActive] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    if (filter === 'all') return photos
    if (filter === '__other') return photos.filter(p => { const tid = p.tournamentId || ''; return !tid || !nameOf[tid] })
    return photos.filter(p => (p.tournamentId || '') === filter)
  }, [photos, filter, nameOf])

  // Deep link: open ?photo=id on first load.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('photo')
    if (!id) return
    const idx = photos.findIndex(p => p.id === id)
    if (idx >= 0) { setFilter('all'); setActive(idx) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = useCallback(() => setActive(null), [])
  const go = useCallback((d: number) => setActive(a => { if (a === null) return a; const n = a + d; return n < 0 ? filtered.length - 1 : n >= filtered.length ? 0 : n }), [filtered.length])

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, close, go])

  async function share(p: Photo) {
    const url = `${location.origin}${location.pathname}?photo=${encodeURIComponent(p.id || '')}`
    try { if ((navigator as any).share) { await (navigator as any).share({ title: p.caption || 'Photo', text: p.caption || '', url }); return } } catch { /* cancelled */ }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* ignore */ }
  }

  if (!photos.length) return <p className="text-slate-400">No photos yet — check back soon.</p>

  const chips: Tourn[] = [{ id: 'all', name: 'All' }, ...cats.list, ...(cats.hasOther ? [{ id: '__other', name: 'Other' }] : [])]
  const cur = active !== null ? filtered[active] : null

  return (
    <>
      {chips.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {chips.map(ch => (
            <button key={ch.id} onClick={() => setFilter(ch.id)} className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${filter === ch.id ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{ch.name}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((ph, i) => (
          <button key={ph.id || i} onClick={() => setActive(i)} className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white text-left">
            <div className="aspect-square overflow-hidden">
              <img src={ph.url} alt={ph.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            {(ph.caption || ph.credit) && (
              <div className="px-3 py-2">
                {ph.caption && <p className="text-xs text-slate-600 truncate">{ph.caption}</p>}
                {ph.credit && <p className="text-[11px] text-slate-400 truncate flex items-center gap-1"><Camera size={11} /> {ph.credit}</p>}
              </div>
            )}
          </button>
        ))}
      </div>

      {cur && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={close}>
          <button onClick={close} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={26} /></button>
          {filtered.length > 1 && <button onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"><ChevronLeft size={36} /></button>}
          {filtered.length > 1 && <button onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"><ChevronRight size={36} /></button>}
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={cur.url} alt={cur.caption || ''} className="max-h-[78vh] w-auto mx-auto rounded-lg object-contain" />
            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="text-white min-w-0">
                {cur.caption && <p className="text-sm font-medium">{cur.caption}</p>}
                <p className="text-xs text-white/60 truncate">{[cur.credit ? `Photo: ${cur.credit}` : '', cur.tournamentId ? nameOf[cur.tournamentId] : ''].filter(Boolean).join(' · ')}</p>
              </div>
              <button onClick={() => share(cur)} className="shrink-0 inline-flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5">
                {copied ? <><Check size={15} /> Link copied</> : <><Share2 size={15} /> Share</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
