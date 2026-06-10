import type { ReactNode } from 'react'

/** Small uppercase section label, e.g. "Game Day", "Admin". */
export default function SectionHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ${className}`}>{children}</h2>
}
