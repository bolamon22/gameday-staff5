'use client'

import { useOrg } from '@/lib/org-context'

export default function OrgLogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const org = useOrg()
  if (!org?.logoUrl) return null
  const cls = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10'
  return (
    <img
      src={org.logoUrl}
      alt={org.name || 'Logo'}
      className={`${cls} object-contain rounded-xl border border-slate-200 bg-white flex-shrink-0`}
    />
  )
}
