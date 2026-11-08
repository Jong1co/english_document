export const PAGE_SIZE = 20

type SearchParam = string | string[] | undefined

function first(value: SearchParam): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

/** Escape LIKE/ILIKE wildcards so user input matches literally. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export function parseListParams(sp: { q?: SearchParam; page?: SearchParam }): { q: string; page: number } {
  const q = first(sp.q).trim()
  const rawPage = first(sp.page)
  const parsed = /^\d{1,9}$/.test(rawPage) ? Number(rawPage) : NaN
  return { q, page: parsed >= 1 ? parsed : 1 }
}

export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * PAGE_SIZE
  return { from, to: from + PAGE_SIZE - 1 }
}
