'use client'
import { useState } from 'react'
import { Maximize2, X } from 'lucide-react'

// Clickable field-map thumbnail that opens a full-screen lightbox.
export default function FieldMap({ src, label }: { src: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative block w-full" aria-label="Enlarge field map">
        <img src={src} alt={label ? `${label} field map` : 'Field map'} className="w-full h-44 object-cover" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-black/55 text-white text-xs px-2 py-1 rounded-full opacity-90 group-hover:opacity-100 transition">
          <Maximize2 size={12} /> Enlarge
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setOpen(false)}>
          <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setOpen(false)} aria-label="Close"><X size={30} /></button>
          {label && <span className="absolute top-5 left-5 text-white/90 text-sm font-medium">{label}</span>}
          <img src={src} alt={label ? `${label} field map` : 'Field map'} className="max-w-full max-h-full object-contain rounded-lg cursor-default" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
