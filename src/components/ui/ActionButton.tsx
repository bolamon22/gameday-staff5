import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface ActionButtonProps {
  icon?: LucideIcon
  children: ReactNode
  href?: string
  target?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  className?: string
}

const VARIANTS = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
}

/** Pill action button with an optional lucide icon. Renders a link when `href` is set. */
export default function ActionButton({ icon: Icon, children, href, target, onClick, variant = 'secondary', className = '' }: ActionButtonProps) {
  const cls = `inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${VARIANTS[variant]} ${className}`
  const content = <>{Icon && <Icon size={14} className="flex-shrink-0" />}{children}</>
  if (href) return <Link href={href} target={target} onClick={onClick} className={cls}>{content}</Link>
  return <button type="button" onClick={onClick} className={cls}>{content}</button>
}
