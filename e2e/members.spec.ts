import { expect, test, type Page } from '@playwright/test'
import { login, TEST_PASSWORD, TEST_USERS, type TestRole } from './helpers'

function roleSelect(page: Page, role: TestRole) {
  return page.getByRole('row').filter({ hasText: TEST_USERS[role].email }).getByRole('combobox', { name: '권한' })
}

/** Change a member's role and wait until the server action has answered. */
async function changeRole(page: Page, member: TestRole, next: TestRole) {
  const saved = page.waitForResponse(
    (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/members',
  )
  await roleSelect(page, member).selectOption(next)
  await saved
}

test('admin은 회원 목록과 역할을 본다', async ({ page }) => {
  await login(page, 'admin')
  await page.getByRole('link', { name: '회원' }).click()
  await expect(page).toHaveURL(/\/members$/)
  await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible()
  for (const role of ['admin', 'editor', 'pending'] as const) {
    await expect(roleSelect(page, role)).toHaveValue(role)
  }
})

test('admin이 pending을 editor로 바꾸면 그 사용자는 /sentences 접근 가능', async ({ page, browser }) => {
  await login(page, 'admin')
  await page.goto('/members')
  await changeRole(page, 'pending', 'editor')
  await page.reload()
  await expect(roleSelect(page, 'pending')).toHaveValue('editor')

  const other = await browser.newContext()
  const otherPage = await other.newPage()
  await otherPage.goto('/login')
  await otherPage.getByLabel('이메일').fill(TEST_USERS.pending.email)
  await otherPage.getByLabel('비밀번호').fill(TEST_PASSWORD)
  await otherPage.getByRole('button', { name: '로그인' }).click()
  await expect(otherPage).toHaveURL(/\/sentences$/)
  await other.close()

  await changeRole(page, 'pending', 'pending')
  await page.reload()
  await expect(roleSelect(page, 'pending')).toHaveValue('pending')
})

test('자기 권한 변경 불가', async ({ page }) => {
  await login(page, 'admin')
  await page.goto('/members')
  await expect(roleSelect(page, 'admin')).toBeDisabled()
  await expect(page.getByRole('row').filter({ hasText: TEST_USERS.admin.email })).toContainText('(나)')
})

test('editor가 /members 접근 → /sentences', async ({ page }) => {
  await login(page, 'editor')
  await page.goto('/members')
  await expect(page).toHaveURL(/\/sentences$/)
})

test('editor 네비게이션에 "회원" 메뉴 없음', async ({ page }) => {
  await login(page, 'editor')
  await expect(page.getByRole('link', { name: '문장', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '회원' })).toHaveCount(0)
})
