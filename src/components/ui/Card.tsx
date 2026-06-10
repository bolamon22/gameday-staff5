import Link from 'next/link'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  href?: string
  target?: string
  onClick?: () => void
}

/** Standard surface used across the app: white bg, hairline border, rounded-xl. */
export default function Card({ children, className = '', href, target, onClick }: CardProps) {
  const interactive = href || onClick
  const base = `bg-white border border-slate-200 rounded-xl ${interactive ? 'hover:border-slate-300 transition-colors cursor-pointer' : ''} ${className}`
  if (href) return <Link href={href} target={target} className={base} onClick={onClick}>{children}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`text-left w-full ${base}`}>{children}</button>
  return <div className={base}>{children}</div>
}
