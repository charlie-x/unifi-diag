'use client'

import { DeviceList } from '@/components/DeviceList'
import { NetworkDiagram } from '@/components/NetworkDiagram'
import { HealthAlerts } from '@/components/HealthAlerts'
import { DiagramProvider } from '@/contexts/DiagramContext'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <DiagramProvider>
      <div className="min-h-screen p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">UniFi Diagnostics</h1>
            <p className="text-sm text-gray-400">Network infrastructure monitoring</p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            Settings
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* health alerts - top priority */}
          <div className="lg:col-span-1">
            <HealthAlerts />
          </div>

          {/* network diagram */}
          <div className="lg:col-span-2">
            <NetworkDiagram />
          </div>

          {/* device list - full width */}
          <div className="lg:col-span-3">
            <DeviceList />
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-gray-500">
          Auto-refreshing every 30 seconds
        </footer>
      </div>
    </DiagramProvider>
  )
}
