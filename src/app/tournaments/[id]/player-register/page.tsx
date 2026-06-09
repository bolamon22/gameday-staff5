import { redirect } from 'next/navigation'

export default function PlayerRegisterRedirect({ params }: { params: { id: string } }) {
  redirect('/tournaments/' + params.id + '/register/individual')
}
