import { prisma } from '@/lib/db'
import { decryptConfig } from '@/lib/encrypt'

export type ProviderName = 'stripe' | 'quickbooks' | 'paypal'

export async function getProviderConfig(userId: string, provider: ProviderName): Promise<Record<string, string> | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT config, enabled FROM OrgPaymentProvider WHERE userId = ? AND provider = ?`, userId, provider
  )
  if (!rows.length || !rows[0].enabled) return null
  return decryptConfig(rows[0].config)
}

// Refresh QBO access token if expired
export async function getQBOAccessToken(userId: string): Promise<{ accessToken: string; companyId: string } | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, config FROM OrgPaymentProvider WHERE userId = ? AND provider = 'quickbooks' AND enabled = 1`, userId
  )
  if (!rows.length) return null

  const cfg = decryptConfig(rows[0].config)
  const now = Date.now()
  const expiry = parseInt(cfg.accessTokenExpiry || '0')

  // If token still valid (with 60s buffer), return it
  if (expiry - now > 60000) {
    return { accessToken: cfg.accessToken, companyId: cfg.companyId }
  }

  // Refresh the token
  try {
    const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: cfg.refreshToken }),
    })
    const tokens = await res.json()
    if (!res.ok) throw new Error('Token refresh failed')

    const newCfg = {
      ...cfg,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || cfg.refreshToken,
      accessTokenExpiry: String(now + tokens.expires_in * 1000),
    }
    const { encryptConfig } = await import('@/lib/encrypt')
    await prisma.$executeRawUnsafe(
      `UPDATE OrgPaymentProvider SET config = ?, updatedAt = ? WHERE id = ?`,
      encryptConfig(newCfg), new Date().toISOString(), rows[0].id
    )
    return { accessToken: tokens.access_token, companyId: cfg.companyId }
  } catch (err) {
    console.error('QBO token refresh failed:', err)
    return null
  }
}
