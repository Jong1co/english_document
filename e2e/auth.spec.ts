import { expect, test } from '@playwright/test'
import { createAdminClient } from './admin-client'
import { login, TEST_PASSWORD, TEST_USERS } from './helpers'

test('비로그인 사용자는 /sentences에서 /login으로 이동', async ({ page }) => {
  await page.goto('/sentences')
  await expect(page).toHaveURL(/\/login$/)
})

test('잘못된 비밀번호는 오류 문구', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(TEST_USERS.editor.email)
  await page.getByLabel('비밀번호').fill('wrong-password')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('pending 로그인 → /pending, /sentences 접근도 /pending', async ({ page }) => {
  await login(page, 'pending')
  await expect(page.getByRole('heading', { name: '관리자 승인 대기 중' })).toBeVisible()
  await page.goto('/sentences')
  await expect(page).toHaveURL(/\/pending$/)
})

test('editor 로그인 → /sentences, 로그아웃 → /login', async ({ page }) => {
  await login(page, 'editor')
  await expect(page.getByRole('heading', { name: '문장 관리' })).toBeVisible()
  await page.getByRole('button', { name: '로그아웃' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/sentences')
  await expect(page).toHaveURL(/\/login$/)
})

test('가입하면 /pending으로 이동', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('이름').fill('새 사용자')
  await page.getByLabel('이메일').fill(`signup-${Date.now()}@test.local`)
  await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: '가입하기' }).click()
  await expect(page).toHaveURL(/\/pending$/)
})

test('프로필이 없는 계정은 승인 대기 화면으로', async ({ page }) => {
  // e.g. an auth user created on the hosted project before the profiles migration
  const admin = createAdminClient()
  const email = `noprofile-${Date.now()}@test.local`
  const { data, error } = await admin.auth.admin.createUser({ email, password: TEST_PASSWORD, email_confirm: true })
  if (error) throw error
  const { error: deleteError } = await admin.from('profiles').delete().eq('id', data.user.id)
  if (deleteError) throw deleteError

  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByRole('heading', { name: '관리자 승인 대기 중' })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await page.goto('/sentences')
  await expect(page).toHaveURL(/\/pending$/)
})
