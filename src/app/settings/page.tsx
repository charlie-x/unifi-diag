import Link from 'next/link'
import { SettingsForm } from '@/components/SettingsForm'
import { GlassCard } from '@/components/ui/GlassCard'
import { THRESHOLDS } from '@/lib/types'

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">Configure UniFi diagnostics</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
          Back to Dashboard
        </Link>
      </header>

      <div className="grid gap-6 max-w-2xl">
        <SettingsForm />

        <GlassCard title="Health Thresholds">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">SFP Temperature Warning</span>
              <span className="text-amber-400">&gt; {THRESHOLDS.SFP_TEMP_WARNING}C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SFP Temperature Critical</span>
              <span className="text-red-400">&gt; {THRESHOLDS.SFP_TEMP_CRITICAL}C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RX Errors Warning</span>
              <span className="text-amber-400">&gt; {THRESHOLDS.RX_ERRORS_WARNING.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RX Errors Critical</span>
              <span className="text-red-400">&gt; {THRESHOLDS.RX_ERRORS_CRITICAL.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RX Dropped Warning</span>
              <span className="text-amber-400">&gt; {THRESHOLDS.RX_DROPPED_WARNING.toLocaleString()}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Thresholds are currently fixed. Future versions may allow customisation.
          </p>
        </GlassCard>

        <GlassCard title="About">
          <div className="text-sm text-gray-400 space-y-2">
            <p>UniFi Diagnostics Dashboard v0.1.0</p>
            <p>Built with Next.js, React Flow, and Tailwind CSS</p>
            <p className="text-xs">
              Data refreshes every 30 seconds. SFP temperatures, port errors, and dropped packets are monitored automatically.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
