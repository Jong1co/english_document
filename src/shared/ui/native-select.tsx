import { cn } from '@/shared/lib/utils'

/** A plain `<select>` styled like the other form controls. */
export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
        className,
      )}
      {...props}
    />
  )
}
