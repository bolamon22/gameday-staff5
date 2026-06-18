'use client'
import { useEffect, useRef, useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'

// Header "Event info" dropdown that jumps to on-page sections.
export default function EventInfoNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  if (!items.length) return null
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-[#0b1f3a] transition-colors">
        <Info size={15} /> Event info <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1.5 z-30">
          {items.map((it, i) => (
            <a key={i} href={it.href} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0b1f3a]">{it.label}</a>
          ))}
        </div>
      )}
    </div>
  )
}
