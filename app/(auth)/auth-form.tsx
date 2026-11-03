'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AuthFormState } from './actions'

type AuthFormProps = {
  mode: 'login' | 'signup'
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const isSignup = mode === 'signup'

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isSignup && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">이름</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </div>
      {state?.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {isSignup ? '가입하기' : '로그인'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? (
          <>
            이미 계정이 있나요? <Link href="/login" className="underline">로그인</Link>
          </>
        ) : (
          <>
            계정이 없나요? <Link href="/signup" className="underline">가입</Link>
          </>
        )}
      </p>
    </form>
  )
}
