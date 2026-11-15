'use server'

import { redirect } from 'next/navigation'
import type { SignInResponse, SignUpResponse } from '@contracts/auth'
import { homePathFor } from '@/entities/user'
import { apiRequest } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'

export type AuthFormState = { message?: string } | null

function field(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await apiRequest<SignInResponse>('POST', '/auth/sign-in', {
    body: { email: field(formData, 'email'), password: field(formData, 'password') },
  })
  if (!result.ok) return { message: result.error.message }
  redirect(homePathFor(result.data.user.role))
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await apiRequest<SignUpResponse>('POST', '/auth/sign-up', {
    body: { name: field(formData, 'name'), email: field(formData, 'email'), password: field(formData, 'password') },
  })
  if (!result.ok) return { message: result.error.message }
  if (result.data.status === 'confirmation-required') {
    return { message: '확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.' }
  }
  redirect(ROUTES.pending)
}

export async function signOut(): Promise<void> {
  await apiRequest('POST', '/auth/sign-out')
  redirect(ROUTES.login)
}
