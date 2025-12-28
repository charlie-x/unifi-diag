'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function GlassCard({ children, className, title, subtitle }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl',
        'shadow-lg shadow-black/20',
        className
      )}
    >
      {(title || subtitle) && (
        <div className="border-b border-white/10 px-4 py-3">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
