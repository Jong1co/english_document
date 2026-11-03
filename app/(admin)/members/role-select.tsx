'use client'

import { useState, useTransition } from 'react'
import type { Role } from '@/lib/auth/roles'
import { selectClassName } from '../sentences/sentence-form'
import { updateMemberRole } from './actions'

const ROLE_LABELS: Record<Role, string> = {
  pending: '승인 대기',
  editor: '에디터',
  admin: '관리자',
}

export function RoleSelect({ memberId, role, disabled }: { memberId: string; role: Role; disabled?: boolean }) {
  const [value, setValue] = useState(role)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function change(next: Role) {
    const previous = value
    setValue(next)
    setMessage(null)
    startTransition(async () => {
      const result = await updateMemberRole(memberId, next)
      if (!result.ok) {
        setValue(previous)
        setMessage(result.message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label="권한"
        className={`${selectClassName} w-36`}
        value={value}
        disabled={disabled || pending}
        onChange={(event) => change(event.target.value as Role)}
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option]}
          </option>
        ))}
      </select>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  )
}
