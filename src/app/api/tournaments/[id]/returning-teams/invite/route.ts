import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Resend } from 'resend'

const APP_URL = process.env.NEXTAUTH_URL || 'https://gameday-staff5.vercel.app'
const FROM_EMAIL = process.env.INVITE_FROM_EMAIL || 'invites@gamedaystaff.com'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { clubs } = await req.json() as {
    clubs: { clubName: string; contactEmail: string; contactName: string }[]
  }
  if (!clubs?.length) return NextResponse.json({ error: 'clubs required' }, { status: 400 })

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { name: true, startDate: true, endDate: true },
  })
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const regUrl = `${APP_URL}/tournaments/${params.id}/register`
  const fmtDate = (d: string) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}/${y}`
  }
  const dateStr = tournament.startDate
    ? tournament.endDate && tournament.endDate !== tournament.startDate
      ? `${fmtDate(tournament.startDate)} – ${fmtDate(tournament.endDate)}`
      : fmtDate(tournament.startDate)
    : ''

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  const errors: string[] = []

  for (const club of clubs) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: club.contactEmail,
        subject: `Registration is open for ${tournament.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
            <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;">
              ${tournament.name} Registration is Open
            </h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">
              Hi ${club.contactName || club.clubName},
            </p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              ${club.clubName} participated in a previous edition of this event and we'd love to have you back!
              ${dateStr ? `<strong>${tournament.name}</strong> is scheduled for <strong>${dateStr}</strong>.` : ''}
              Registration is now open — click below to reserve your spot.
            </p>
            <a href="${regUrl}"
              style="display:inline-block;background:#14b8a6;color:white;font-weight:600;
                     font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">
              Register Now →
            </a>
            <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
              Questions? Reply to this email and we'll get back to you.
            </p>
          </div>
        `,
      })
      sent++
    } catch (e: any) {
      errors.push(`${club.clubName}: ${e.message}`)
    }
  }

  return NextResponse.json({ sent, errors })
}
