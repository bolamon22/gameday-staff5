'use client'
import { X, Plus } from 'lucide-react'
import type { RegPricing, Bracket } from '@/lib/regPricing'

// Dynamic registration-fee editor: auto-chaining volume tiers (add/remove, last
// is "and up") plus an optional flat-rate tier with an editable name + match.
export default function RegPricingEditor({ value, onChange }: { value: RegPricing; onChange: (p: RegPricing) => void }) {
  const tiers = value.tiers
  const inputCls = 'border border-slate-300 rounded-lg px-3 py-1.5 w-24 text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'
  const maxCls = 'border border-slate-300 rounded px-1.5 py-0.5 w-14 text-center text-sm focus:outline-none focus:ring-1 focus:ring-teal-500'

  const setTiers = (t: Bracket[]) => onChange({ ...value, tiers: t.length ? t : [{ max: null, price: 0 }] })
  const update = (i: number, patch: Partial<Bracket>) => setTiers(tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)))
  const removeTier = (i: number) => {
    let t = tiers.filter((_, j) => j !== i)
    if (!t.length) t = [{ max: null, price: 0 }]
    if (!t.some(x => x.max === null)) t = t.map((x, j) => (j === t.length - 1 ? { ...x, max: null } : x))
    setTiers(t)
  }
  const addTier = () => {
    const openIdx = tiers.findIndex(t => t.max === null)
    const at = openIdx === -1 ? tiers.length : openIdx
    const prevMax = at > 0 ? (tiers[at - 1].max ?? 0) : 0
    const newTier: Bracket = { max: prevMax + 1, price: tiers[at]?.price ?? tiers[at - 1]?.price ?? 0 }
    setTiers([...tiers.slice(0, at), newTier, ...tiers.slice(at)])
  }
  const startFor = (i: number) => (i === 0 ? 1 : (tiers[i - 1].max ?? 0) + 1)
  const flat = value.flat

  return (
    <div className="space-y-3">
      {tiers.map((t, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-1 flex-wrap">
            {t.max === null
              ? <>{startFor(i)}+ teams</>
              : <>{startFor(i)}–<input type="number" min={startFor(i)} className={maxCls} value={t.max} onChange={e => update(i, { max: parseInt(e.target.value) || startFor(i) })} /> teams</>}
            <span className="text-slate-400 font-normal text-xs ml-1">per team</span>
          </p>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-sm">$</span>
            <input type="number" min="0" step="1" className={inputCls} value={t.price} onChange={e => update(i, { price: parseFloat(e.target.value) || 0 })} />
            <button type="button" title="Remove tier" disabled={tiers.length <= 1} onClick={() => removeTier(i)} className="text-slate-300 hover:text-red-500 disabled:opacity-0 ml-1"><X size={15} /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addTier} className="text-sm text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"><Plus size={14} /> Add tier</button>

      <div className="pt-3 border-t border-slate-100">
        {flat ? (
          <div className="flex items-center justify-between gap-3 py-1 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <input type="text" className="border border-slate-300 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-teal-500" value={flat.label} placeholder="Tier name" onChange={e => onChange({ ...value, flat: { ...flat, label: e.target.value } })} />
              <span className="text-xs text-slate-400">divisions containing</span>
              <input type="text" className="border border-slate-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-teal-500" value={flat.match} placeholder="7v7" onChange={e => onChange({ ...value, flat: { ...flat, match: e.target.value } })} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-sm">$</span>
              <input type="number" min="0" step="1" className={inputCls} value={flat.price} onChange={e => onChange({ ...value, flat: { ...flat, price: parseFloat(e.target.value) || 0 } })} />
              <button type="button" title="Remove tier" onClick={() => onChange({ ...value, flat: null })} className="text-slate-300 hover:text-red-500 ml-1"><X size={15} /></button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => onChange({ ...value, flat: { label: '7v7 teams', match: '7v7', price: 1095 } })} className="text-sm text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"><Plus size={14} /> Add flat-rate tier</button>
        )}
      </div>
    </div>
  )
}
