import { NextResponse } from 'next/server'
import { getDevices, ConfigurationError } from '@/lib/unifi-api'
import type { DevicesResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data, stale } = await getDevices()

    const response: DevicesResponse = {
      devices: data,
      timestamp: Date.now(),
      stale,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch devices:', error)

    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        { error: error.message, code: 'NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch devices from UniFi controller' },
      { status: 500 }
    )
  }
}
