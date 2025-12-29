// unifi device types

export interface UnifiPort {
  port_idx: number
  name: string
  up: boolean
  speed: number
  full_duplex: boolean
  rx_bytes: number
  tx_bytes: number
  rx_errors: number
  tx_errors: number
  rx_dropped: number
  tx_dropped: number
  poe_enable?: boolean
  poe_power?: string
  poe_voltage?: string
  sfp_found?: boolean
  sfp_vendor?: string
  sfp_part?: string
  sfp_temperature?: string
  sfp_rxpower?: string
  sfp_txpower?: string
  last_connection?: {
    mac: string
    last_seen: number
  }
  media?: string
  locating?: boolean
}

export interface UnifiUplink {
  port_idx: number
  uplink_mac: string
  uplink_device_name: string
  uplink_remote_port: number
  type: string  // 'wire' or 'wireless' (mesh)
  speed?: number
  rssi?: number  // signal strength for wireless uplinks
  channel?: number
}

export interface UnifiDevice {
  _id: string
  mac: string
  name: string
  type: 'usw' | 'uap' | 'ugw' | 'udm'
  model: string
  version: string
  ip: string
  state: number
  uptime: number
  adopted: boolean
  upgradable: boolean
  overheating?: boolean
  general_temperature?: number
  total_used_power?: number
  total_max_power?: number
  port_table?: UnifiPort[]
  last_uplink?: UnifiUplink
  lldp_table?: Array<{
    chassis_id: string
    is_wired: boolean
    local_port_idx: number
    local_port_name: string
    port_id: string
  }>
}

export interface UnifiClient {
  mac: string
  name?: string
  hostname?: string
  ip?: string
  oui?: string
}

export interface HealthAlert {
  id: string
  type: 'temperature' | 'errors' | 'dropped' | 'upgrade'
  severity: 'warning' | 'critical'
  device: string
  deviceId: string
  port?: number
  message: string
  value: number
  threshold: number
}

export interface DevicesResponse {
  devices: UnifiDevice[]
  timestamp: number
  stale: boolean
}

export interface ClientsResponse {
  clients: UnifiClient[]
  timestamp: number
}

export interface HealthResponse {
  alerts: HealthAlert[]
  timestamp: number
  stale: boolean
}

// health thresholds
export const THRESHOLDS = {
  SFP_TEMP_WARNING: 70,
  SFP_TEMP_CRITICAL: 80,
  RX_ERRORS_WARNING: 100,
  RX_ERRORS_CRITICAL: 10000,
  RX_DROPPED_WARNING: 100000,
} as const
