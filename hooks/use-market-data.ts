"use client"

import useSWR from "swr"
import { POLL_INTERVAL_MS } from "@/lib/terminal/config"
import type { MarketSnapshot } from "@/lib/terminal/types"

const fetcher = async (url: string): Promise<MarketSnapshot> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function useMarketData() {
  const { data, error, isLoading, mutate } = useSWR<MarketSnapshot>("/api/market", fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    dedupingInterval: 500,
    keepPreviousData: true,
    revalidateOnFocus: false,
  })

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
