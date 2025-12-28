'use client'

import { cn } from '@/lib/utils'

type Status = 'healthy' | 'warning' | 'error' | 'offline'

interface StatusBadgeProps {
  status: Status
  label?: string
  className?: string
  pulse?: boolean
}

const statusStyles: Record<Status, string> = {
  healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  offline: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const dotStyles: Record<Status, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  offline: 'bg-gray-500',
}

export function StatusBadge({ status, label, className, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          dotStyles[status],
          pulse && 'animate-pulse'
        )}
      />
      {label}
    </span>
  )
}

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', dotStyles[status], className)}
    />
  )
}
