'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireSentenceManager } from '@/lib/auth/dal'
import type { SourceOption } from '@/lib/sentences/queries'
import {
  isUuid,
  parseSentenceForm,
  parseSourceForm,
  type FieldErrors,
  type SentenceInput,
  type SourceInput,
} from '@/lib/sentences/schema'
import { createClient } from '@/lib/supabase/server'

type SentenceFormValues = Record<keyof SentenceInput, string>

export type SentenceFormState = {
  fieldErrors?: FieldErrors<SentenceInput>
  message?: string
  /** What the user submitted, so the form can show it again after React resets it. */
  values?: SentenceFormValues
} | null

export type SourceFormState = {
  fieldErrors?: FieldErrors<SourceInput>
  message?: string
  source?: SourceOption
} | null

const SAVE_FAILED = '저장하지 못했습니다. 다시 시도하세요.'

function submittedValues(formData: FormData): SentenceFormValues {
  const read = (key: string) => {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
  }
  return {
    sentence: read('sentence'),
    meaning: read('meaning'),
    description: read('description'),
    sourceId: read('sourceId'),
  }
}

function toRow(input: SentenceInput) {
  return {
    sentence: input.sentence,
    meaning: input.meaning,
    description: input.description,
    source_id: input.sourceId,
  }
}

export async function createSentence(_prev: SentenceFormState, formData: FormData): Promise<SentenceFormState> {
  await requireSentenceManager()
  const values = submittedValues(formData)
  const parsed = parseSentenceForm(formData)
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values }

  const supabase = await createClient()
  const { error } = await supabase.from('sentences').insert(toRow(parsed.data))
  if (error) return { message: SAVE_FAILED, values }
  redirect('/sentences')
}

export async function updateSentence(
  id: string,
  _prev: SentenceFormState,
  formData: FormData,
): Promise<SentenceFormState> {
  await requireSentenceManager()
  const values = submittedValues(formData)
  if (!isUuid(id)) return { message: SAVE_FAILED, values }
  const parsed = parseSentenceForm(formData)
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values }

  const supabase = await createClient()
  const { data, error } = await supabase.from('sentences').update(toRow(parsed.data)).eq('id', id).select('id')
  if (error) return { message: SAVE_FAILED, values }
  if (data.length === 0) return { message: '문장을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.', values }
  redirect('/sentences')
}

export async function deleteSentence(id: string): Promise<void> {
  await requireSentenceManager()
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { error } = await supabase.from('sentences').delete().eq('id', id)
  if (error) throw new Error('삭제하지 못했습니다.')
  refresh()
}

export async function createSource(_prev: SourceFormState, formData: FormData): Promise<SourceFormState> {
  await requireSentenceManager()
  const parsed = parseSourceForm(formData)
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sources')
    .insert(parsed.data)
    .select('id, type, title, url')
    .single()
  if (error) return { message: SAVE_FAILED }
  return { source: data }
}
