import type { Page } from '@playwright/test'

export const TEST_PASSWORD = 'password123!'

export const TEST_USERS = {
  admin: { email: 'admin@test.local', name: '관리자' },
  editor: { email: 'editor@test.local', name: '에디터' },
  pending: { email: 'pending@test.local', name: '대기자' },
} as const

export type TestRole = keyof typeof TEST_USERS

export async function login(page: Page, role: TestRole): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(TEST_USERS[role].email)
  await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL(role === 'pending' ? /\/pending$/ : /\/sentences$/)
}
