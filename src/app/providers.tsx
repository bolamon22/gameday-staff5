'use client'

import { SessionProvider } from 'next-auth/react'
import { RoleProvider } from '@/lib/role-context'
import { OrgProvider } from '@/lib/org-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RoleProvider><OrgProvider>{children}</OrgProvider></RoleProvider>
    </SessionProvider>
  )
}
