import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  href?: string
}

/** Metric tile: large neutral number, muted label, optional sub-line and link. */
export default function StatCard({ label, value, sub, href }: StatCardProps) {
  const inner = (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 transition-colors${href ? ' hover:border-slate-300 cursor-pointer' : ''}`}>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
