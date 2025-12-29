'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { UnifiDevice } from '@/lib/types'
import { formatUptime } from '@/lib/utils'

interface APTooltipProps {
  device: UnifiDevice
  children: React.ReactNode
}

export function APTooltip({ device, children }: APTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    }, 300)
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

  // check if this is a meshed AP
  const isMeshed = device.last_uplink?.type === 'wireless'
  const meshParent = isMeshed ? device.uplink?.uplink_device_name : null
  const meshRssi = device.uplink?.rssi
  const meshSignal = device.uplink?.signal
  const meshChannel = device.uplink?.channel

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full"
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
            <div className="bg-gray-900/95 border border-white/20 rounded-lg px-3 py-2 text-xs shadow-xl backdrop-blur-sm min-w-[200px] max-w-[300px]">
              {/* header */}
              <div className="border-b border-white/10 pb-1.5 mb-1.5">
                <span className="font-medium text-white">{device.name}</span>
                <span className="text-gray-400 ml-2">{device.model}</span>
              </div>

              {/* basic info */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 mb-1.5">
                <span className="text-gray-500">MAC:</span>
                <span className="font-mono text-[10px]">{device.mac}</span>
                <span className="text-gray-500">IP:</span>
                <span className="font-mono">{device.ip}</span>
                <span className="text-gray-500">Firmware:</span>
                <span className="font-mono">{device.version}</span>
                <span className="text-gray-500">Uptime:</span>
                <span>{formatUptime(device.uptime)}</span>
              </div>

              {/* status */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300 border-t border-white/10 pt-1.5 mb-1.5">
                <span className="text-gray-500">State:</span>
                <span className={device.state === 1 ? 'text-green-400' : 'text-red-400'}>
                  {device.state === 1 ? 'Online' : 'Offline'}
                </span>
                {device.general_temperature && (
                  <>
                    <span className="text-gray-500">Temperature:</span>
                    <span className={device.general_temperature > 50 ? 'text-amber-400' : ''}>
                      {device.general_temperature}C
                    </span>
                  </>
                )}
                {device.upgradable && (
                  <>
                    <span className="text-gray-500">Update:</span>
                    <span className="text-amber-400">Available</span>
                  </>
                )}
              </div>

              {/* mesh info */}
              {isMeshed && (
                <div className="border-t border-white/10 pt-1.5">
                  <span className="text-cyan-400 font-medium block mb-1">Mesh Uplink</span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300">
                    <span className="text-gray-500">Parent:</span>
                    <span className="text-white">{meshParent || 'Unknown'}</span>
                    {meshRssi && (
                      <>
                        <span className="text-gray-500">Signal:</span>
                        <span className={meshRssi > -50 ? 'text-green-400' : meshRssi > -70 ? 'text-amber-400' : 'text-red-400'}>
                          {meshRssi} dBm {meshSignal && `(${meshSignal}%)`}
                        </span>
                      </>
                    )}
                    {meshChannel && (
                      <>
                        <span className="text-gray-500">Channel:</span>
                        <span>{meshChannel}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* wired uplink info */}
              {!isMeshed && device.last_uplink && (
                <div className="border-t border-white/10 pt-1.5">
                  <span className="text-gray-400 font-medium block mb-1">Wired Uplink</span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300">
                    <span className="text-gray-500">Switch:</span>
                    <span className="text-white">{device.last_uplink.uplink_device_name}</span>
                    <span className="text-gray-500">Port:</span>
                    <span>Port {device.last_uplink.uplink_remote_port}</span>
                  </div>
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
