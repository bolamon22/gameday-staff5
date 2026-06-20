import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { parsePricing, feeScheduleLines } from '@/lib/regPricing'

export const runtime = 'nodejs'

// Public-facing Chirp: answers attendee questions (coaches, parents, players)
// about ONE tournament, grounded only in that event's public info. No staff,
// pay, or financial data.
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Assistant not configured.' }, { status: 503 })
  }
  try {
    const { messages, tournamentId } = await req.json()
    let context = 'You are Chirp, a friendly assistant for a sports tournament. Be concise and welcoming.'

    if (tournamentId) {
      try {
        const [t, games, site] = await Promise.all([
          prisma.tournament.findUnique({ where: { id: tournamentId } }),
          prisma.game.findMany({ where: { tournamentId, isCanceled: false }, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] }),
          prisma.appSetting.findUnique({ where: { key: `tournamentSite:${tournamentId}` } }).catch(() => null),
        ])
        if (t) {
          const tt: any = t
          let c: any = {}
          try { c = JSON.parse((site as any)?.value || '{}') } catch {}
          const divisions: string[] = (() => { try { const d = JSON.parse(tt.registrationDivisions || '[]'); return Array.isArray(d) ? d.filter(Boolean) : [] } catch { return [] } })()
          const fees = (() => { try { return feeScheduleLines(parsePricing(tt.registrationPricing)) } catch { return [] } })()
          const locations: any[] = Array.isArray(c.locations) ? c.locations : []
          const sched = games.slice(0, 90).map((g: any) =>
            `${g.date} ${g.startTime || 'TBD'} | ${g.location || 'TBD'} | ${g.division}${g.pool ? (' ' + g.pool) : ''} | ${g.team1} vs ${g.team2}${(g.score1 != null && g.score2 != null) ? ` (final ${g.score1}-${g.score2})` : ''}`
          ).join('\n')

          context = `You are Chirp, the friendly assistant for ${tt.name}${tt.sport ? ` (${tt.sport})` : ''}. You help attendees — coaches, parents, and players — with questions about THIS event. Use ONLY the information below. Be concise, warm, and welcoming. If you're unsure, say so and point them to the event page or the organizer. Never discuss staff pay, finances, or internal operations. If asked your name, you are Chirp.

EVENT: ${tt.name}
DATES: ${tt.startDate || 'TBA'}${tt.endDate && tt.endDate !== tt.startDate ? ` to ${tt.endDate}` : ''}
LOCATION: ${tt.location || 'TBA'}
DIVISIONS (${divisions.length}): ${divisions.join(', ') || 'TBA'}
${fees.length ? `FEES (per team):\n${fees.join('\n')}` : ''}
${(c.hotelsUrl || c.hotels) ? `HOTELS: ${c.hotelsUrl ? `book at ${c.hotelsUrl}` : ''}${c.hotels ? ` ${String(c.hotels).slice(0, 400)}` : ''}` : ''}
${locations.length ? `VENUES:\n${locations.map((l: any) => `- ${l.name || 'Venue'}${l.address ? ` — ${l.address}` : ''}`).join('\n')}` : ''}
${c.overview ? `OVERVIEW:\n${String(c.overview).slice(0, 800)}` : ''}
${c.rules ? `RULES (summary):\n${String(c.rules).slice(0, 1500)}` : ''}
SCHEDULE (${games.length} games):
${sched || 'Schedule not posted yet.'}

To register a team, attendees use the event's Register page. Point people to the event page for full details.`
        }
      } catch (e) { console.error('public-chat context error:', e) }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: context,
      messages: (messages || []).map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ message: text })
  } catch (e: unknown) {
    console.error('public-chat error:', e)
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
