import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveBlocks, newBlock } from '@/lib/eventBlocks'

export const runtime = 'nodejs'

// Appends a Q&A into the tournament event page's FAQ (Collapsible sections) block,
// creating one if none exists. Used by the "Add to event page" button on Chirp insights.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Sign in to edit' }, { status: 401 })
  try {
    const { question, answer } = await req.json()
    if (!question || !String(question).trim()) return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    const key = `tournamentSite:${params.id}`
    const row = await prisma.appSetting.findUnique({ where: { key } }).catch(() => null)
    let c: any = {}
    try { c = JSON.parse((row as any)?.value || '{}') } catch {}

    const blocks: any[] = resolveBlocks(c)
    const item = { q: String(question).slice(0, 300), a: String(answer || '').slice(0, 1500) }
    let faq = blocks.find(b => b.type === 'faq' && (!b.props || b.props.display !== 'page'))
    if (!faq) faq = blocks.find(b => b.type === 'faq')
    if (faq) {
      faq.props = faq.props || {}
      const items = Array.isArray(faq.props.items) ? faq.props.items.filter((it: any) => it && (it.q || it.a)) : []
      items.push(item)
      faq.props.items = items
      if (!faq.props.title) faq.props.title = 'FAQ'
      faq.hidden = false
    } else {
      const nb: any = newBlock('faq')
      nb.props = { title: 'FAQ', items: [item], display: 'inline' }
      blocks.push(nb)
    }
    c.blocks = blocks
    await prisma.appSetting.upsert({ where: { key }, update: { value: JSON.stringify(c) }, create: { key, value: JSON.stringify(c) } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('add-faq error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 })
  }
}
