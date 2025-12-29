import { NextResponse } from 'next/server'
import { getDevices, ConfigurationError } from '@/lib/unifi-api'
import type { HealthAlert, HealthResponse, UnifiDevice, UnifiPort, THRESHOLDS } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const thresholds = {
  SFP_TEMP_WARNING: 70,
  SFP_TEMP_CRITICAL: 80,
  RX_ERRORS_WARNING: 100,
  RX_ERRORS_CRITICAL: 10000,
  RX_DROPPED_WARNING: 100000,
}

function checkPortHealth(device: UnifiDevice, port: UnifiPort): HealthAlert[] {
  const alerts: HealthAlert[] = []

  // check sfp temperature
  if (port.sfp_temperature) {
    const temp = parseFloat(port.sfp_temperature)
    if (temp >= thresholds.SFP_TEMP_CRITICAL) {
      alerts.push({
        id: `${device._id}-port${port.port_idx}-temp-critical`,
        type: 'temperature',
        severity: 'critical',
        device: device.name,
        deviceId: device._id,
        port: port.port_idx,
        message: `Port ${port.port_idx} SFP at ${temp.toFixed(1)}C (critical)`,
        value: temp,
        threshold: thresholds.SFP_TEMP_CRITICAL,
      })
    } else if (temp >= thresholds.SFP_TEMP_WARNING) {
      alerts.push({
        id: `${device._id}-port${port.port_idx}-temp-warning`,
        type: 'temperature',
        severity: 'warning',
        device: device.name,
        deviceId: device._id,
        port: port.port_idx,
        message: `Port ${port.port_idx} SFP at ${temp.toFixed(1)}C`,
        value: temp,
        threshold: thresholds.SFP_TEMP_WARNING,
      })
    }
  }

  // check rx errors
  if (port.rx_errors >= thresholds.RX_ERRORS_CRITICAL) {
    alerts.push({
      id: `${device._id}-port${port.port_idx}-errors-critical`,
      type: 'errors',
      severity: 'critical',
      device: device.name,
      deviceId: device._id,
      port: port.port_idx,
      message: `Port ${port.port_idx} has ${port.rx_errors.toLocaleString()} rx errors`,
      value: port.rx_errors,
      threshold: thresholds.RX_ERRORS_CRITICAL,
    })
  } else if (port.rx_errors >= thresholds.RX_ERRORS_WARNING) {
    alerts.push({
      id: `${device._id}-port${port.port_idx}-errors-warning`,
      type: 'errors',
      severity: 'warning',
      device: device.name,
      deviceId: device._id,
      port: port.port_idx,
      message: `Port ${port.port_idx} has ${port.rx_errors.toLocaleString()} rx errors`,
      value: port.rx_errors,
      threshold: thresholds.RX_ERRORS_WARNING,
    })
  }

  // check rx dropped
  if (port.rx_dropped >= thresholds.RX_DROPPED_WARNING) {
    alerts.push({
      id: `${device._id}-port${port.port_idx}-dropped`,
      type: 'dropped',
      severity: 'warning',
      device: device.name,
      deviceId: device._id,
      port: port.port_idx,
      message: `Port ${port.port_idx} has ${port.rx_dropped.toLocaleString()} dropped packets`,
      value: port.rx_dropped,
      threshold: thresholds.RX_DROPPED_WARNING,
    })
  }

  return alerts
}

function checkDeviceHealth(device: UnifiDevice): HealthAlert[] {
  const alerts: HealthAlert[] = []

  // check if device needs upgrade
  if (device.upgradable) {
    alerts.push({
      id: `${device._id}-upgrade`,
      type: 'upgrade',
      severity: 'warning',
      device: device.name,
      deviceId: device._id,
      message: `Firmware upgrade available`,
      value: 1,
      threshold: 0,
    })
  }

  // check device overheating
  if (device.overheating) {
    alerts.push({
      id: `${device._id}-overheating`,
      type: 'temperature',
      severity: 'critical',
      device: device.name,
      deviceId: device._id,
      message: `Device overheating (${device.general_temperature}C)`,
      value: device.general_temperature || 0,
      threshold: 0,
    })
  }

  // check all ports
  if (device.port_table) {
    for (const port of device.port_table) {
      alerts.push(...checkPortHealth(device, port))
    }
  }

  return alerts
}

export async function GET() {
  try {
    const { data: devices, stale } = await getDevices()

    const alerts: HealthAlert[] = []
    for (const device of devices) {
      alerts.push(...checkDeviceHealth(device))
    }

    // sort by severity (critical first) then by device name
    alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1
      if (a.severity !== 'critical' && b.severity === 'critical') return 1
      return a.device.localeCompare(b.device)
    })

    const response: HealthResponse = {
      alerts,
      timestamp: Date.now(),
      stale,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to check health:', error)

    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        { error: error.message, code: 'NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check health' },
      { status: 500 }
    )
  }
}
