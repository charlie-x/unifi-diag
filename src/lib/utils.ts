import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatSpeed(speed: number): string {
  if (speed >= 10000) return '10G'
  if (speed >= 2500) return '2.5G'
  if (speed >= 1000) return '1G'
  if (speed >= 100) return '100M'
  if (speed > 0) return `${speed}M`
  return 'Down'
}

export function getDeviceIcon(type: string): string {
  switch (type) {
    case 'usw':
      return 'switch'
    case 'uap':
      return 'wifi'
    case 'ugw':
    case 'udm':
      return 'router'
    default:
      return 'device'
  }
}

export function getDeviceTypeName(type: string): string {
  switch (type) {
    case 'usw':
      return 'Switch'
    case 'uap':
      return 'Access Point'
    case 'ugw':
      return 'Gateway'
    case 'udm':
      return 'Dream Machine'
    default:
      return 'Device'
  }
}
