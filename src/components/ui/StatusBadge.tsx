'use client'

import { cn } from '@/lib/utils'
import LiquidGlass from 'liquid-glass-react'

type Status = 'healthy' | 'warning' | 'error' | 'offline'

interface StatusBadgeProps {
  status: Status
  label?: string
  className?: string
  pulse?: boolean
}

const dotStyles: Record<Status, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  offline: 'bg-gray-500',
}

export function StatusBadge({ status, label, className, pulse }: StatusBadgeProps) {
  return (
    <LiquidGlass
      displacementScale={30}
      blurAmount={0.1}
      saturation={140}
      aberrationIntensity={1.5}
      elasticity={0.3}
      cornerRadius={999}
      overLight={false}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white',
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
    </LiquidGlass>
  )
}

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', dotStyles[status], className)}
    />
  )
}
