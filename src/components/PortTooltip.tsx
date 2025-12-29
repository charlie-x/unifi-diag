'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { UnifiPort, UnifiClient, UnifiDevice } from '@/lib/types'
import { formatSpeed, formatBytes } from '@/lib/utils'

interface PortTooltipProps {
  port: UnifiPort
  device: UnifiDevice
  clients: UnifiClient[]
  children: React.ReactNode
}

interface LldpEntry {
  local_port_idx: number
  system_name?: string
  chassis_id: string
  port_description?: string
  management_address?: string
}

// get stp state display
function getStpStateDisplay(state?: string): { label: string; color: string } {
  switch (state) {
    case 'forwarding':
      return { label: 'FWD', color: 'text-green-400' }
    case 'blocking':
      return { label: 'BLK', color: 'text-red-400' }
    case 'learning':
      return { label: 'LRN', color: 'text-amber-400' }
    case 'listening':
      return { label: 'LSN', color: 'text-amber-400' }
    case 'disabled':
      return { label: 'DIS', color: 'text-gray-500' }
    default:
      return { label: '-', color: 'text-gray-500' }
  }
}

export function PortTooltip({ port, device, clients, children }: PortTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // find connected device via LLDP
  const lldpEntry = device.lldp_table?.find(
    (entry) => entry.local_port_idx === port.port_idx
  ) as LldpEntry | undefined

  // find connected client by switch port
  const connectedClient = clients.find(
    (client) =>
      client.is_wired &&
      client.sw_mac === device.mac &&
      client.sw_port === port.port_idx
  )

  // also check last_connection on port
  const lastConnection = port.last_connection

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        })
        setIsVisible(true)
      }
    }, 200)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const stpDisplay = getStpStateDisplay(port.stp_state)

  // determine what's connected
  let connectedName = ''
  let connectedDetail = ''

  if (lldpEntry) {
    connectedName = lldpEntry.system_name || lldpEntry.chassis_id
    connectedDetail = lldpEntry.port_description || lldpEntry.management_address || ''
  } else if (connectedClient) {
    connectedName = connectedClient.name || connectedClient.hostname || 'Client'
    connectedDetail = connectedClient.ip || connectedClient.mac
  } else if (lastConnection) {
    connectedName = 'Unknown device'
    connectedDetail = lastConnection.mac
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900/95 border border-white/20 rounded-lg px-3 py-2 text-xs shadow-xl backdrop-blur-sm min-w-[180px] max-w-[280px]">
              {/* header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <span className="font-medium text-white">
                  Port {port.port_idx}
                  {port.name && port.name !== `Port ${port.port_idx}` && (
                    <span className="text-gray-400 ml-1">({port.name})</span>
                  )}
                </span>
                <span
                  className={`font-mono ${port.up ? 'text-green-400' : 'text-gray-500'}`}
                >
                  {port.up ? 'UP' : 'DOWN'}
                </span>
              </div>

              {/* link info */}
              {port.up && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 mb-1.5">
                  <span className="text-gray-500">Speed:</span>
                  <span className="font-mono">{formatSpeed(port.speed)}</span>
                  <span className="text-gray-500">Duplex:</span>
                  <span className="font-mono">
                    {port.full_duplex ? 'Full' : 'Half'}
                  </span>
                  {port.media && (
                    <>
                      <span className="text-gray-500">Media:</span>
                      <span className="font-mono">{port.media}</span>
                    </>
                  )}
                </div>
              )}

              {/* stp state */}
              {port.stp_state && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 mb-1.5 border-t border-white/10 pt-1.5">
                  <span className="text-gray-500">STP:</span>
                  <span className={`font-mono ${stpDisplay.color}`}>
                    {stpDisplay.label}
                    {port.is_uplink && ' [root]'}
                  </span>
                  {port.stp_pathcost !== undefined && (
                    <>
                      <span className="text-gray-500">Path cost:</span>
                      <span className="font-mono">{port.stp_pathcost}</span>
                    </>
                  )}
                </div>
              )}

              {/* poe info */}
              {port.poe_enable && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 mb-1.5 border-t border-white/10 pt-1.5">
                  <span className="text-gray-500">PoE:</span>
                  <span className="font-mono text-cyan-400">
                    {port.poe_power || 'Enabled'}
                    {port.poe_voltage && ` @ ${port.poe_voltage}V`}
                  </span>
                </div>
              )}

              {/* sfp info */}
              {port.sfp_found && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 mb-1.5 border-t border-white/10 pt-1.5">
                  <span className="text-gray-500">SFP:</span>
                  <span className="font-mono">
                    {port.sfp_vendor} {port.sfp_part}
                  </span>
                  {port.sfp_temperature && (
                    <>
                      <span className="text-gray-500">Temp:</span>
                      <span
                        className={`font-mono ${
                          parseFloat(port.sfp_temperature) > 70
                            ? 'text-amber-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {parseFloat(port.sfp_temperature).toFixed(1)}C
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* connected device */}
              {(connectedName || port.up) && (
                <div className="border-t border-white/10 pt-1.5">
                  <span className="text-gray-500 block mb-0.5">Connected:</span>
                  {connectedName ? (
                    <div className="text-white">
                      <span className="font-medium">{connectedName}</span>
                      {connectedDetail && (
                        <span className="text-gray-400 block text-[10px] font-mono">
                          {connectedDetail}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">No LLDP/client data</span>
                  )}
                </div>
              )}

              {/* traffic stats */}
              {port.up && (port.rx_bytes > 0 || port.tx_bytes > 0) && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 border-t border-white/10 pt-1.5 mt-1.5">
                  <span className="text-gray-500">RX:</span>
                  <span className="font-mono">{formatBytes(port.rx_bytes)}</span>
                  <span className="text-gray-500">TX:</span>
                  <span className="font-mono">{formatBytes(port.tx_bytes)}</span>
                </div>
              )}

              {/* errors/dropped */}
              {(port.rx_errors > 0 || port.tx_errors > 0 || port.rx_dropped > 0) && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-white/10 pt-1.5 mt-1.5">
                  {port.rx_errors > 0 && (
                    <>
                      <span className="text-gray-500">RX Errors:</span>
                      <span className="font-mono text-red-400">{port.rx_errors}</span>
                    </>
                  )}
                  {port.tx_errors > 0 && (
                    <>
                      <span className="text-gray-500">TX Errors:</span>
                      <span className="font-mono text-red-400">{port.tx_errors}</span>
                    </>
                  )}
                  {port.rx_dropped > 0 && (
                    <>
                      <span className="text-gray-500">Dropped:</span>
                      <span className="font-mono text-amber-400">
                        {port.rx_dropped}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* arrow */}
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full">
                <div className="border-8 border-transparent border-t-gray-900/95" />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
