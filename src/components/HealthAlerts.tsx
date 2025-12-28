'use client'

import { useHealth } from '@/hooks/useHealth'
import { GlassCard } from './ui/GlassCard'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, string> = {
  temperature: '[T]',
  errors: '[E]',
  dropped: '[D]',
  upgrade: '[U]',
}

export function HealthAlerts() {
  const { data, isLoading, error } = useHealth()

  if (isLoading) {
    return (
      <GlassCard title="Health Alerts">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-white/5" />
          ))}
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard title="Health Alerts">
        <p className="text-red-400">Failed to load health data</p>
      </GlassCard>
    )
  }

  const alerts = data?.alerts || []
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length

  return (
    <GlassCard
      title="Health Alerts"
      subtitle={
        alerts.length === 0
          ? 'All systems healthy'
          : `${criticalCount} critical, ${warningCount} warnings`
      }
    >
      {alerts.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-green-400">
          <span className="text-4xl mr-3">[OK]</span>
          <span className="text-lg">No issues detected</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm',
                alert.severity === 'critical'
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs opacity-60">
                  {typeIcons[alert.type] || '[?]'}
                </span>
                <span className="font-medium">{alert.device}</span>
                {alert.port && (
                  <span className="text-xs opacity-60">Port {alert.port}</span>
                )}
              </div>
              <p className="mt-0.5 opacity-80">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
      {data?.stale && (
        <p className="mt-2 text-xs text-amber-400">Data may be stale</p>
      )}
    </GlassCard>
  )
}
