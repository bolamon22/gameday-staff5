import { redirect } from 'next/navigation'

export default function IndividualRegisterRedirect({ params }: { params: { id: string } }) {
  redirect('/tournaments/' + params.id + '/register/individual')
}
