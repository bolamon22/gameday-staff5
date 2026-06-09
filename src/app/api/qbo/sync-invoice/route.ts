import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getQBOAccessToken } from '@/lib/paymentProviders'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const { registrationId } = await req.json()
  const tokens = await getQBOAccessToken(userId)
  if (!tokens) return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 503 })

  const regsRaw = await prisma.$queryRawUnsafe<any[]>('SELECT * FROM TeamRegistration WHERE id = ?', registrationId)
  if (!regsRaw.length) return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  const reg = regsRaw[0]

  // If already synced, return existing invoice ID — no duplicate
  if (reg.qboInvoiceId) {
    return NextResponse.json({ ok: true, alreadySynced: true, invoiceId: reg.qboInvoiceId, docNumber: reg.qboInvoiceId })
  }

  const baseUrl = `https://quickbooks.api.intuit.com/v3/company/${tokens.companyId}`
  const headers = {
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  try {
    // Find or create customer
    let customerId = reg.qboCustomerId || null

    if (!customerId) {
      const custSearch = await fetch(
        `${baseUrl}/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${String(reg.clubName).replace(/'/g, "\\'")}'`)}&minorversion=65`,
        { headers }
      )
      const custData = await custSearch.json()
      customerId = custData?.QueryResponse?.Customer?.[0]?.Id

      if (!customerId) {
        const createCust = await fetch(`${baseUrl}/customer?minorversion=65`, {
          method: 'POST', headers,
          body: JSON.stringify({
            DisplayName: reg.clubName,
            PrimaryEmailAddr: { Address: reg.contactEmail },
            PrimaryPhone: { FreeFormNumber: reg.contactPhone },
          }),
        })
        const newCust = await createCust.json()
        customerId = newCust?.Customer?.Id
      }

      // Save customer ID so we don't search again next time
      await prisma.$executeRawUnsafe('UPDATE TeamRegistration SET qboCustomerId = ? WHERE id = ?', customerId, registrationId)
    }

    const due = (reg.invoiceAmount || 0) - (reg.discountAmount || 0)
    const invoiceRes = await fetch(`${baseUrl}/invoice?minorversion=65`, {
      method: 'POST', headers,
      body: JSON.stringify({
        CustomerRef: { value: customerId },
        Line: [{
          Amount: due,
          DetailType: 'SalesItemLineDetail',
          Description: `Tournament Registration — ${reg.clubName}`,
          SalesItemLineDetail: { ItemRef: { value: '1', name: 'Services' }, UnitPrice: due, Qty: 1 },
        }],
        CustomerMemo: { value: `Registration ID: ${reg.id}` },
      }),
    })
    const invoiceData = await invoiceRes.json()
    const invoiceId = invoiceData?.Invoice?.Id
    const docNumber = invoiceData?.Invoice?.DocNumber

    if (!invoiceId) throw new Error(invoiceData?.Fault?.Error?.[0]?.Message || 'Invoice creation failed')

    // Save invoice ID — prevents any future duplicates
    await prisma.$executeRawUnsafe('UPDATE TeamRegistration SET qboInvoiceId = ? WHERE id = ?', invoiceId, registrationId)

    return NextResponse.json({ ok: true, customerId, invoiceId, docNumber })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
