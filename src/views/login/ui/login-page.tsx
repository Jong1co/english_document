import { AuthForm, signIn } from '@/features/auth'

export function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">로그인</h1>
      <AuthForm mode="login" action={signIn} />
    </>
  )
}
