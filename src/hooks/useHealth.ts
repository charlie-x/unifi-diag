'use client'

import { useQuery } from '@tanstack/react-query'
import type { HealthResponse } from '@/lib/types'

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/unifi/health')
      if (!res.ok) throw new Error('Failed to fetch health')
      return res.json()
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000,
  })
}
