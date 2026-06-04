// Shared auth helper for seed scripts
const BASE = 'https://gameday-staff5.vercel.app'

async function getSessionCookie(email = 'bo@lacrossewear.com', password = 'changeme123') {
  // Step 1: get CSRF token + its cookie
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()
  const csrfSetCookie = csrfRes.headers.getSetCookie
    ? csrfRes.headers.getSetCookie()
    : [csrfRes.headers.get('set-cookie') || '']
  const csrfCookieStr = csrfSetCookie.map(c => c.split(';')[0]).filter(Boolean).join('; ')

  // Step 2: sign in with credentials
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookieStr,
    },
    redirect: 'manual',
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/`,
      json: 'true',
    }).toString(),
  })

  // Grab ALL Set-Cookie headers from the login response
  const sessionCookies = loginRes.headers.getSetCookie
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get('set-cookie') || '']

  const allCookies = [
    ...csrfCookieStr.split('; ').filter(Boolean),
    ...sessionCookies.map(c => c.split(';')[0]).filter(Boolean),
  ]

  const cookieStr = allCookies.join('; ')
  if (!cookieStr) throw new Error('Login failed — no cookies received')

  // Verify we have a session token
  const hasSession = cookieStr.includes('next-auth.session-token') ||
                     cookieStr.includes('__Secure-next-auth.session-token')
  if (!hasSession) throw new Error(`Login failed — no session token in cookies: ${cookieStr}`)

  console.log('✅ Authenticated')
  return cookieStr
}

module.exports = { BASE, getSessionCookie }
