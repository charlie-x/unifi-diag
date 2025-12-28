'use client'

import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { GlassCard } from './ui/GlassCard'
import { StatusBadge } from './ui/StatusBadge'
import { SwitchPortGrid } from './SwitchPortGrid'
import { formatUptime, getDeviceTypeName } from '@/lib/utils'
import type { UnifiDevice } from '@/lib/types'

function DeviceCard({ device }: { device: UnifiDevice }) {
  const [expanded, setExpanded] = useState(false)

  const status = device.state === 1 ? 'healthy' : 'offline'
  const hasIssues = device.overheating || device.upgradable

  return (
    <div
      className="rounded-lg border border-white/10 bg-white/5 overflow-hidden cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono text-gray-400">
            {device.type === 'usw' && '[S]'}
            {device.type === 'uap' && '[W]'}
            {(device.type === 'ugw' || device.type === 'udm') && '[R]'}
          </span>
          <div>
            <h4 className="font-medium text-white">{device.name}</h4>
            <p className="text-xs text-gray-400">
              {getDeviceTypeName(device.type)} - {device.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasIssues && (
            <StatusBadge
              status={device.overheating ? 'error' : 'warning'}
              label={device.overheating ? 'Hot' : 'Update'}
            />
          )}
          <StatusBadge status={status} label={status === 'healthy' ? 'Online' : 'Offline'} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">IP</span>
              <p className="font-mono text-white">{device.ip}</p>
            </div>
            <div>
              <span className="text-gray-400">MAC</span>
              <p className="font-mono text-white text-xs">{device.mac}</p>
            </div>
            <div>
              <span className="text-gray-400">Uptime</span>
              <p className="text-white">{formatUptime(device.uptime)}</p>
            </div>
            <div>
              <span className="text-gray-400">Firmware</span>
              <p className="text-white">{device.version}</p>
            </div>
            {device.general_temperature && (
              <div>
                <span className="text-gray-400">Temperature</span>
                <p className="text-white">{device.general_temperature}C</p>
              </div>
            )}
            {device.total_used_power !== undefined && device.total_used_power !== null && (
              <div>
                <span className="text-gray-400">PoE Power</span>
                <p className="text-white">
                  {device.total_used_power.toFixed(1)}W / {device.total_max_power}W
                </p>
              </div>
            )}
          </div>

          {device.type === 'usw' && device.port_table && (
            <SwitchPortGrid ports={device.port_table} deviceName={device.name} />
          )}
        </div>
      )}
    </div>
  )
}

export function DeviceList() {
  const { data, isLoading, error, dataUpdatedAt } = useDevices()

  if (isLoading) {
    return (
      <GlassCard title="Devices">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded bg-white/5" />
          ))}
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard title="Devices">
        <p className="text-red-400">Failed to load devices</p>
      </GlassCard>
    )
  }

  const devices = data?.devices || []
  const switches = devices.filter((d) => d.type === 'usw')
  const aps = devices.filter((d) => d.type === 'uap')
  const gateways = devices.filter((d) => d.type === 'ugw' || d.type === 'udm')

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : 'never'

  return (
    <GlassCard
      title="Devices"
      subtitle={`${devices.length} devices - Updated ${lastUpdated}`}
    >
      <div className="space-y-4">
        {gateways.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Gateways</h4>
            <div className="space-y-2">
              {gateways.map((device) => (
                <DeviceCard key={device._id} device={device} />
              ))}
            </div>
          </div>
        )}

        {switches.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Switches</h4>
            <div className="space-y-2">
              {switches.map((device) => (
                <DeviceCard key={device._id} device={device} />
              ))}
            </div>
          </div>
        )}

        {aps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Access Points</h4>
            <div className="space-y-2">
              {aps.map((device) => (
                <DeviceCard key={device._id} device={device} />
              ))}
            </div>
          </div>
        )}
      </div>

      {data?.stale && (
        <p className="mt-3 text-xs text-amber-400">Data may be stale - controller unreachable</p>
      )}
    </GlassCard>
  )
}
