'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface OrgData {
  id: string
  name: string
  logoUrl?: string
  slug?: string
}

const OrgContext = createContext<OrgData | null>(null)

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<OrgData | null>(null)
  useEffect(() => {
    fetch('/api/admin/org')
      .then(r => r.json())
      .then(d => { if (d?.id) setOrg(d) })
      .catch(() => {})
  }, [])
  return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
}

export function useOrg() {
  return useContext(OrgContext)
}
