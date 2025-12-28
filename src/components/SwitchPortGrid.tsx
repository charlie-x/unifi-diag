'use client'

import { cn } from '@/lib/utils'
import { formatSpeed } from '@/lib/utils'
import { useClients } from '@/hooks/useDevices'
import type { UnifiPort } from '@/lib/types'

interface SwitchPortGridProps {
  ports: UnifiPort[]
  deviceName: string
}

function PortCell({ port }: { port: UnifiPort }) {
  const { data: clientsData } = useClients()
  const clients = clientsData?.clients || []

  // find client name for connected mac
  const connectedMac = port.last_connection?.mac
  const clientName = connectedMac
    ? clients.find((c) => c.mac.toLowerCase() === connectedMac.toLowerCase())?.name ||
      clients.find((c) => c.mac.toLowerCase() === connectedMac.toLowerCase())?.hostname
    : null

  // determine status
  const hasErrors = port.rx_errors > 100 || port.tx_errors > 100
  const hasHighErrors = port.rx_errors > 10000
  const hasDropped = port.rx_dropped > 100000
  const isHot = port.sfp_temperature && parseFloat(port.sfp_temperature) > 70
  const isCriticalHot = port.sfp_temperature && parseFloat(port.sfp_temperature) > 80

  let bgColor = 'bg-gray-800/50'
  let borderColor = 'border-gray-700'

  if (port.up) {
    bgColor = 'bg-green-900/30'
    borderColor = 'border-green-700/50'

    if (hasErrors || hasDropped || isHot) {
      bgColor = 'bg-amber-900/30'
      borderColor = 'border-amber-600/50'
    }

    if (hasHighErrors || isCriticalHot) {
      bgColor = 'bg-red-900/30'
      borderColor = 'border-red-600/50'
    }
  }

  const isSfp = port.media === 'SFP+' || port.sfp_found
  const is25g = port.media === '2P5GE'

  return (
    <div
      className={cn(
        'rounded border p-2 text-xs transition-colors',
        bgColor,
        borderColor
      )}
      title={`Port ${port.port_idx}${connectedMac ? ` - ${connectedMac}` : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-bold text-white">
          {port.port_idx}
        </span>
        <span
          className={cn(
            'text-[10px] font-medium',
            port.up ? 'text-green-400' : 'text-gray-500'
          )}
        >
          {formatSpeed(port.speed)}
        </span>
      </div>

      {port.up && (
        <>
          {clientName && (
            <p className="truncate text-[10px] text-gray-300" title={clientName}>
              {clientName}
            </p>
          )}
          {!clientName && connectedMac && (
            <p className="truncate text-[10px] text-gray-500 font-mono" title={connectedMac}>
              {connectedMac.slice(-8)}
            </p>
          )}
        </>
      )}

      {isSfp && port.sfp_temperature && (
        <p
          className={cn(
            'text-[10px] mt-0.5',
            isCriticalHot
              ? 'text-red-400'
              : isHot
              ? 'text-amber-400'
              : 'text-gray-500'
          )}
        >
          {parseFloat(port.sfp_temperature).toFixed(0)}C
        </p>
      )}

      {(hasErrors || hasDropped) && (
        <p className="text-[10px] text-amber-400 mt-0.5">
          {hasHighErrors ? `${(port.rx_errors / 1000).toFixed(0)}k err` : hasErrors ? `${port.rx_errors} err` : ''}
          {hasDropped ? ` ${(port.rx_dropped / 1000000).toFixed(1)}M drop` : ''}
        </p>
      )}

      {/* port type indicator */}
      <div className="flex gap-1 mt-1">
        {isSfp && (
          <span className="text-[8px] px-1 rounded bg-purple-900/50 text-purple-300">SFP</span>
        )}
        {is25g && (
          <span className="text-[8px] px-1 rounded bg-blue-900/50 text-blue-300">2.5G</span>
        )}
        {port.poe_enable && (
          <span className="text-[8px] px-1 rounded bg-yellow-900/50 text-yellow-300">PoE</span>
        )}
      </div>
    </div>
  )
}

export function SwitchPortGrid({ ports, deviceName }: SwitchPortGridProps) {
  // separate regular ports from sfp ports
  const regularPorts = ports.filter((p) => p.media !== 'SFP+' && !p.name?.includes('SFP'))
  const sfpPorts = ports.filter((p) => p.media === 'SFP+' || p.name?.includes('SFP'))

  return (
    <div className="space-y-3">
      <div>
        <h5 className="text-xs text-gray-400 mb-2">Ports</h5>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
          {regularPorts.map((port) => (
            <PortCell key={port.port_idx} port={port} />
          ))}
        </div>
      </div>

      {sfpPorts.length > 0 && (
        <div>
          <h5 className="text-xs text-gray-400 mb-2">SFP+ Ports</h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {sfpPorts.map((port) => (
              <PortCell key={port.port_idx} port={port} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
