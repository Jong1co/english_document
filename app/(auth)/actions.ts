'use server'

import { redirect } from 'next/navigation'
import { homePathFor } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export type AuthFormState = { message?: string } | null

const MIN_PASSWORD_LENGTH = 8

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()
  redirect(homePathFor(profile?.role ?? 'pending'))
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!name || !email) {
    return { message: '이름과 이메일을 입력하세요.' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { message: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) {
    const exists = error.code === 'user_already_exists' || error.code === 'email_exists'
    return { message: exists ? '이미 가입된 이메일입니다.' : '가입하지 못했습니다. 다시 시도하세요.' }
  }
  if (!data.session) {
    return { message: '확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.' }
  }
  redirect('/pending')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
