import { AuthForm, signUp } from '@/features/auth'

export function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">가입</h1>
      <AuthForm mode="signup" action={signUp} />
    </>
  )
}
