import { signIn } from '../actions'
import { AuthForm } from '../auth-form'

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">로그인</h1>
      <AuthForm mode="login" action={signIn} />
    </>
  )
}
