'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SourceOption } from '@/lib/sentences/queries'
import { SOURCE_TYPE_LABELS, SOURCE_TYPES } from '@/lib/sentences/schema'
import { createSource, type SourceFormState } from './actions'
import { selectClassName } from './sentence-form'

export function SourceDialog({ onCreated }: { onCreated: (source: SourceOption) => void }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(async (prev: SourceFormState, formData: FormData) => {
    const next = await createSource(prev, formData)
    if (next?.source) {
      onCreated(next.source)
      setOpen(false)
      return null
    }
    return next
  }, null)
  const errors = state?.fieldErrors ?? {}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>출처 추가</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>출처 추가</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="source-type">유형</Label>
            <select id="source-type" name="type" className={selectClassName} defaultValue="manual">
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SOURCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source-title">제목</Label>
            <Input id="source-title" name="title" maxLength={200} required />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source-url">URL</Label>
            <Input id="source-url" name="url" inputMode="url" placeholder="https://" />
            {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
          </div>
          {state?.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            출처 저장
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
