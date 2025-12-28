'use client'

import { useQuery } from '@tanstack/react-query'
import type { DevicesResponse, ClientsResponse } from '@/lib/types'

export function useDevices() {
  return useQuery<DevicesResponse>({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/unifi/devices')
      if (!res.ok) throw new Error('Failed to fetch devices')
      return res.json()
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000,
  })
}

export function useClients() {
  return useQuery<ClientsResponse>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/unifi/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
    refetchInterval: 60000, // 60 seconds
    staleTime: 55000,
  })
}
