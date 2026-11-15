'use server'

import { redirect } from 'next/navigation'
import type { FieldErrors } from '@contracts/common'
import type { Source, SourceRequest } from '@/entities/source'
import type { SentenceRequest } from '@/entities/sentence'
import { requireSentenceManager } from '@/entities/user/server'
import { apiRequest, type ApiError } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'

export type SentenceFormState = {
  fieldErrors?: FieldErrors<SentenceRequest>
  message?: string
  /** What the user submitted, so the form can show it again after React resets it. */
  values?: SentenceRequest
} | null

export type SourceFormState = {
  fieldErrors?: FieldErrors<SourceRequest>
  message?: string
  source?: Source
} | null

const SAVE_FAILED = '저장하지 못했습니다. 다시 시도하세요.'

function field(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function sentenceValues(formData: FormData): SentenceRequest {
  return {
    sentence: field(formData, 'sentence'),
    meaning: field(formData, 'meaning'),
    description: field(formData, 'description'),
    sourceId: field(formData, 'sourceId'),
  }
}

function sentenceFailure(error: ApiError, values: SentenceRequest): SentenceFormState {
  if (error.code === 'VALIDATION_FAILED') return { fieldErrors: error.fieldErrors, values }
  if (error.code === 'NOT_FOUND') return { message: error.message, values }
  return { message: SAVE_FAILED, values }
}

export async function createSentence(_prev: SentenceFormState, formData: FormData): Promise<SentenceFormState> {
  await requireSentenceManager()
  const values = sentenceValues(formData)
  const result = await apiRequest('POST', '/sentences', { body: values })
  if (!result.ok) return sentenceFailure(result.error, values)
  redirect(ROUTES.sentences)
}

export async function updateSentence(
  id: string,
  _prev: SentenceFormState,
  formData: FormData,
): Promise<SentenceFormState> {
  await requireSentenceManager()
  const values = sentenceValues(formData)
  const result = await apiRequest('PUT', `/sentences/${encodeURIComponent(id)}`, { body: values })
  if (!result.ok) return sentenceFailure(result.error, values)
  redirect(ROUTES.sentences)
}

export async function createSource(_prev: SourceFormState, formData: FormData): Promise<SourceFormState> {
  await requireSentenceManager()
  const body: SourceRequest = {
    type: field(formData, 'type'),
    title: field(formData, 'title'),
    url: field(formData, 'url'),
  }
  const result = await apiRequest<Source>('POST', '/sources', { body })
  if (!result.ok) {
    return result.error.code === 'VALIDATION_FAILED' ? { fieldErrors: result.error.fieldErrors } : { message: SAVE_FAILED }
  }
  return { source: result.data }
}
