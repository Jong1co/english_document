import { Button } from '@/shared/ui/button'
import { signOut } from '../api/actions'

export function SignOutButton({ size }: { size?: 'sm' }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size={size}>
        로그아웃
      </Button>
    </form>
  )
}
