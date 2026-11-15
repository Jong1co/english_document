'use client'

import { useState, useTransition } from 'react'
import { ROLE_LABELS, ROLES, type Role } from '@/entities/user'
import { NativeSelect } from '@/shared/ui/native-select'
import { changeMemberRole } from '../api/actions'

export function RoleSelect({ memberId, role, disabled }: { memberId: string; role: Role; disabled?: boolean }) {
  const [value, setValue] = useState(role)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function change(next: Role) {
    const previous = value
    setValue(next)
    setMessage(null)
    startTransition(async () => {
      const result = await changeMemberRole(memberId, next)
      if (!result.ok) {
        setValue(previous)
        setMessage(result.message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <NativeSelect
        aria-label="권한"
        className="w-36"
        value={value}
        disabled={disabled || pending}
        onChange={(event) => change(event.target.value as Role)}
      >
        {ROLES.map((option) => (
          <option key={option} value={option}>
            {ROLE_LABELS[option]}
          </option>
        ))}
      </NativeSelect>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  )
}
