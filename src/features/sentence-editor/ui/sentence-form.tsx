'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { Sentence } from '@/entities/sentence'
import type { Source } from '@/entities/source'
import { ROUTES } from '@/shared/config/routes'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { NativeSelect } from '@/shared/ui/native-select'
import { Textarea } from '@/shared/ui/textarea'
import type { SentenceFormState } from '../api/actions'
import { SourceDialog } from './source-dialog'

type SentenceFormProps = {
  action: (prev: SentenceFormState, formData: FormData) => Promise<SentenceFormState>
  sources: Source[]
  initial?: Sentence
}

export function SentenceForm({ action, sources: initialSources, initial }: SentenceFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const [sources, setSources] = useState(initialSources)
  const [sourceId, setSourceId] = useState(initial?.source?.id ?? '')
  const errors = state?.fieldErrors ?? {}
  const values = state?.values

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field id="sentence" label="문장" error={errors.sentence}>
        <Textarea
          id="sentence"
          name="sentence"
          rows={2}
          maxLength={1000}
          required
          defaultValue={values?.sentence ?? initial?.sentence}
          aria-invalid={Boolean(errors.sentence)}
        />
      </Field>
      <Field id="meaning" label="뜻" error={errors.meaning}>
        <Input
          id="meaning"
          name="meaning"
          maxLength={1000}
          required
          defaultValue={values?.meaning ?? initial?.meaning}
          aria-invalid={Boolean(errors.meaning)}
        />
      </Field>
      <Field id="description" label="설명" error={errors.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={5000}
          placeholder="언제, 어떻게 쓰는지"
          defaultValue={values?.description ?? initial?.description ?? ''}
          aria-invalid={Boolean(errors.description)}
        />
      </Field>
      <Field id="sourceId" label="출처" error={errors.sourceId}>
        <div className="flex gap-2">
          <NativeSelect
            id="sourceId"
            name="sourceId"
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
          >
            <option value="">출처 없음</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.title}
              </option>
            ))}
          </NativeSelect>
          <SourceDialog
            onCreated={(source) => {
              setSources((current) => [source, ...current])
              setSourceId(source.id)
            }}
          />
        </div>
      </Field>
      {state?.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          저장
        </Button>
        <Link href={ROUTES.sentences} className={buttonVariants({ variant: 'outline' })}>
          취소
        </Link>
      </div>
    </form>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
