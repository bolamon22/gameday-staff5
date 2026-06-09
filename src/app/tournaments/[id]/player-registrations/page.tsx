import { redirect } from 'next/navigation'

export default function PlayerRegistrationsRedirect({ params }: { params: { id: string } }) {
  redirect('/tournaments/' + params.id + '/registrations')
}
