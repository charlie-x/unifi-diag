import { NextResponse } from 'next/server'
import { getClients } from '@/lib/unifi-api'
import type { ClientsResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data, stale } = await getClients()

    const response: ClientsResponse = {
      clients: data,
      timestamp: Date.now(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients from UniFi controller' },
      { status: 500 }
    )
  }
}
