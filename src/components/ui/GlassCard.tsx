'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import LiquidGlass from 'liquid-glass-react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  cracks?: number
}

export function GlassCard({ children, className, title, subtitle, cracks = 0 }: GlassCardProps) {
  return (
    <LiquidGlass
      fillContainer
      cracks={cracks}
      className={cn('rounded-xl', className)}
    >
      {(title || subtitle) && (
        <div className="border-b border-white/10 px-4 py-3">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </LiquidGlass>
  )
}
