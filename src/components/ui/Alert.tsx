'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type AlertVariant = 'warning' | 'error' | 'info'

interface AlertProps {
  variant: AlertVariant
  title?: string
  children: ReactNode
  className?: string
}

const variantStyles: Record<AlertVariant, string> = {
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
}

const iconStyles: Record<AlertVariant, string> = {
  warning: 'text-amber-400',
  error: 'text-red-400',
  info: 'text-blue-400',
}

export function Alert({ variant, title, children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex gap-3">
        <span className={cn('text-lg', iconStyles[variant])}>
          {variant === 'warning' && '!'}
          {variant === 'error' && 'X'}
          {variant === 'info' && 'i'}
        </span>
        <div className="flex-1">
          {title && <h4 className="font-medium">{title}</h4>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}
