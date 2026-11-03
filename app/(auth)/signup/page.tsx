import { signUp } from '../actions'
import { AuthForm } from '../auth-form'

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">가입</h1>
      <AuthForm mode="signup" action={signUp} />
    </>
  )
}
