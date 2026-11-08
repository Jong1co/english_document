import { expect, test, type Page } from '@playwright/test'
import { login } from './helpers'

function uid(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`
}

function rowWith(page: Page, text: string) {
  return page.getByRole('row').filter({ hasText: text })
}

async function addSentence(page: Page, fields: { sentence: string; meaning: string; description?: string }) {
  await page.goto('/sentences/new')
  await page.getByLabel('문장', { exact: true }).fill(fields.sentence)
  await page.getByLabel('뜻', { exact: true }).fill(fields.meaning)
  if (fields.description) await page.getByLabel('설명', { exact: true }).fill(fields.description)
  await page.getByRole('button', { name: '저장' }).click()
  await page.waitForURL(/\/sentences$/)
}

test.beforeEach(async ({ page }) => {
  await login(page, 'editor')
})

test('새 출처와 함께 문장 추가 → 목록에 표시', async ({ page }) => {
  const id = uid()
  await page.goto('/sentences/new')
  await page.getByRole('button', { name: '출처 추가' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('유형').selectOption('youtube')
  await dialog.getByLabel('제목').fill(`Cebu vlog ${id}`)
  await dialog.getByRole('button', { name: '출처 저장' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('select[name="sourceId"] option:checked')).toHaveText(`Cebu vlog ${id}`)

  await page.getByLabel('문장', { exact: true }).fill(`Did you sleep well? ${id}`)
  await page.getByLabel('뜻', { exact: true }).fill('잘 잤어?')
  await page.getByLabel('설명', { exact: true }).fill('지난밤 잠에 대해 묻는다.')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page).toHaveURL(/\/sentences$/)
  const row = rowWith(page, `Did you sleep well? ${id}`)
  await expect(row).toContainText('잘 잤어?')
  await expect(row).toContainText(`Cebu vlog ${id}`)
})

test('출처 없이 추가 가능', async ({ page }) => {
  const id = uid()
  await addSentence(page, { sentence: `No source ${id}`, meaning: '출처 없음' })
  await expect(rowWith(page, `No source ${id}`)).toBeVisible()
})

test('공백만 입력하면 필드 오류', async ({ page }) => {
  await page.goto('/sentences/new')
  await page.getByLabel('문장', { exact: true }).fill('   ')
  await page.getByLabel('뜻', { exact: true }).fill('   ')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('문장을 입력하세요.')).toBeVisible()
  await expect(page.getByText('뜻을 입력하세요.')).toBeVisible()
  await expect(page).toHaveURL(/\/sentences\/new$/)
})

test('수정하면 목록에 반영', async ({ page }) => {
  const id = uid()
  await addSentence(page, { sentence: `Edit me ${id}`, meaning: '수정 전' })
  await rowWith(page, `Edit me ${id}`).getByRole('link', { name: '수정' }).click()
  await expect(page.getByLabel('뜻', { exact: true })).toHaveValue('수정 전')
  await page.getByLabel('뜻', { exact: true }).fill('수정 후')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page).toHaveURL(/\/sentences$/)
  await expect(rowWith(page, `Edit me ${id}`)).toContainText('수정 후')
})

test('삭제 확인 후 목록에서 사라짐', async ({ page }) => {
  const id = uid()
  await addSentence(page, { sentence: `Delete me ${id}`, meaning: '삭제 대상' })
  await rowWith(page, `Delete me ${id}`).getByRole('button', { name: '삭제' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('이 문장을 삭제할까요? 되돌릴 수 없습니다.')
  await confirm.getByRole('button', { name: '삭제' }).click()
  await expect(rowWith(page, `Delete me ${id}`)).toHaveCount(0)
})

test('특수문자 검색은 글자 그대로', async ({ page }) => {
  const id = uid()
  await addSentence(page, { sentence: `Save 50% now ${id}`, meaning: '할인' })
  await addSentence(page, { sentence: `Save 500 now ${id}`, meaning: '할인' })
  await page.getByRole('searchbox', { name: '검색' }).fill(`50% now ${id}`)
  await page.getByRole('searchbox', { name: '검색' }).press('Enter')
  await expect(page).toHaveURL(/q=/)
  await expect(rowWith(page, id)).toHaveCount(1)
  await expect(rowWith(page, `Save 50% now ${id}`)).toBeVisible()
})

test('없는 문장 수정 URL은 404', async ({ page }) => {
  await page.goto('/sentences/not-a-uuid/edit')
  await expect(page.getByText('페이지를 찾을 수 없습니다.')).toBeVisible()
  await page.goto('/sentences/3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d/edit')
  await expect(page.getByText('페이지를 찾을 수 없습니다.')).toBeVisible()
})

test('범위를 넘는 페이지는 빈 목록', async ({ page }) => {
  await page.goto('/sentences?page=9999')
  await expect(page.getByText('문장이 없습니다.')).toBeVisible()
})

test('세션이 끊긴 상태로 저장하면 /login', async ({ page }) => {
  await page.goto('/sentences/new')
  await page.getByLabel('문장', { exact: true }).fill('Expired session')
  await page.getByLabel('뜻', { exact: true }).fill('세션 만료')
  await page.context().clearCookies()
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
