'use client'
import { useState } from 'react'
import { Sparkles, Copy, Check, Plus } from 'lucide-react'

type Faq = { question: string; answer: string }

export default function ChirpFaqSuggest({ tournamentId, disabled }: { tournamentId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Faq[] | null>(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [added, setAdded] = useState<Record<number, 'loading' | 'done' | 'error'>>({})

  async function run() {
    setLoading(true); setErr(''); setItems(null)
    try {
      const res = await fetch(`/api/chirp-faq-suggest/${tournamentId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Could not generate suggestions.')
      else setItems(Array.isArray(data.suggestions) ? data.suggestions : [])
    } catch { setErr('Network error.') }
    setLoading(false)
  }
  const copy = (i: number, f: Faq) => { try { navigator.clipboard.writeText(`${f.question}\n${f.answer}`); setCopied(i); setTimeout(() => setCopied(null), 1500) } catch {} }
  async function addToPage(i: number, f: Faq) {
    setAdded(a => ({ ...a, [i]: 'loading' }))
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/add-faq`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: f.question, answer: f.answer }) })
      setAdded(a => ({ ...a, [i]: res.ok ? 'done' : 'error' }))
    } catch { setAdded(a => ({ ...a, [i]: 'error' })) }
  }

  return (
    <div>
      <button type="button" onClick={run} disabled={loading || disabled}
        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        <Sparkles size={15} /> {loading ? 'Generating…' : 'Generate FAQ suggestions'}
      </button>
      {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      {items && items.length === 0 && <p className="text-sm text-slate-500 mt-3">No clear themes yet — check back once more questions come in.</p>}
      {items && items.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">Draft answers from your attendees' questions. Review, then add the good ones under Setup → Event page → a Collapsible sections block.</p>
          {items.map((f, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900 text-sm">{f.question}</p>
                <button type="button" onClick={() => copy(i, f)} className="text-slate-400 hover:text-teal-700 shrink-0" title="Copy">
                  {copied === i ? <Check size={15} className="text-teal-600" /> : <Copy size={15} />}
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{f.answer}</p>
              <div className="mt-2.5">
                {added[i] === 'done' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"><Check size={14} /> Added to event page</span>
                ) : (
                  <button type="button" onClick={() => addToPage(i, f)} disabled={added[i] === 'loading'}
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 disabled:opacity-50">
                    <Plus size={14} /> {added[i] === 'loading' ? 'Adding…' : 'Add to event page'}
                  </button>
                )}
                {added[i] === 'error' && <span className="text-xs text-red-600 ml-2">Couldn't add — try again.</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
