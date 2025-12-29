// server-side unifi api client with caching

import { UnifiDevice, UnifiClient } from './types'

const UNIFI_API_URL = process.env.UNIFI_API_URL || ''
const UNIFI_API_KEY = process.env.UNIFI_API_KEY || ''

// check if credentials are configured
export function isConfigured(): boolean {
  return Boolean(UNIFI_API_URL && UNIFI_API_KEY)
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

// simple in-memory cache
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache: {
  devices?: CacheEntry<UnifiDevice[]>
  clients?: CacheEntry<UnifiClient[]>
} = {}

const CACHE_TTL = {
  devices: 30 * 1000, // 30 seconds
  clients: 60 * 1000, // 60 seconds
}

async function fetchUnifi<T>(endpoint: string): Promise<T> {
  if (!isConfigured()) {
    throw new ConfigurationError(
      'UniFi API not configured. Set UNIFI_API_URL and UNIFI_API_KEY in .env.local'
    )
  }

  const response = await fetch(`${UNIFI_API_URL}/${endpoint}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': UNIFI_API_KEY,
      'Content-Type': 'application/json',
    },
    // skip ssl verification for self-signed certs
    // @ts-expect-error - node fetch option
    rejectUnauthorized: false,
  })

  if (!response.ok) {
    throw new Error(`UniFi API error: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()
  return json.data as T
}

export async function getDevices(): Promise<{ data: UnifiDevice[]; stale: boolean }> {
  const now = Date.now()
  const cached = cache.devices

  // return cached if fresh
  if (cached && now - cached.timestamp < CACHE_TTL.devices) {
    return { data: cached.data, stale: false }
  }

  try {
    const devices = await fetchUnifi<UnifiDevice[]>('stat/device')
    cache.devices = { data: devices, timestamp: now }
    return { data: devices, stale: false }
  } catch (error) {
    // return stale cache on error
    if (cached) {
      console.error('UniFi API error, returning stale cache:', error)
      return { data: cached.data, stale: true }
    }
    throw error
  }
}

export async function getClients(): Promise<{ data: UnifiClient[]; stale: boolean }> {
  const now = Date.now()
  const cached = cache.clients

  if (cached && now - cached.timestamp < CACHE_TTL.clients) {
    return { data: cached.data, stale: false }
  }

  try {
    const clients = await fetchUnifi<UnifiClient[]>('rest/user')
    cache.clients = { data: clients, timestamp: now }
    return { data: clients, stale: false }
  } catch (error) {
    if (cached) {
      console.error('UniFi API error, returning stale cache:', error)
      return { data: cached.data, stale: true }
    }
    throw error
  }
}

export function getMacName(mac: string, clients: UnifiClient[]): string | undefined {
  const client = clients.find(c => c.mac.toLowerCase() === mac.toLowerCase())
  return client?.name || client?.hostname
}
