import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted/50 dark:bg-white/[0.06]', className)}
      {...props}
    />
  )
}

export { Skeleton }
