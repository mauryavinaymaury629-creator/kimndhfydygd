import * as bitget from "./bitget"
import * as mexc from "./mexc"
import * as okx from "./okx"
import type { DepthSnapshot, KlineBar, LiquidationEvent, TapeTrade, TickerSnapshot } from "../types"

// Ordered fallback chain: Bitget -> MEXC -> OKX. Bitget is primary (cleanest public
// futures API + genuine liquidation feed); the others cover us on outage/rate-limit.
const CHAIN = [bitget, mexc, okx] as const

export let lastSourceUsed = "BITGET"

async function withFallback<T>(fn: (mod: (typeof CHAIN)[number]) => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown
  for (const mod of CHAIN) {
    try {
      const result = await fn(mod)
      lastSourceUsed = mod.EXCHANGE_NAME
      return result
    } catch (err) {
      lastErr = err
    }
  }
  throw new Error(`All exchanges failed for ${label}: ${String(lastErr)}`)
}

export function getTicker(): Promise<TickerSnapshot> {
  return withFallback((mod) => mod.fetchTicker(), "ticker")
}

export function getOpenInterest(): Promise<number> {
  return withFallback((mod) => mod.fetchOpenInterest?.() ?? Promise.reject("n/a"), "openInterest").catch(() => 0)
}

export function getKlines(limit = 200): Promise<KlineBar[]> {
  return withFallback((mod) => mod.fetchKlines(limit), "klines")
}

export function getDepth(limit = 20): Promise<DepthSnapshot> {
  return withFallback((mod) => mod.fetchDepth(limit), "depth")
}

export function getTrades(limit = 50): Promise<TapeTrade[]> {
  return withFallback((mod) => mod.fetchTrades(limit), "trades")
}

// Only Bitget exposes a public liquidation feed; treat as best-effort/optional.
export async function getLiquidations(limit = 30): Promise<LiquidationEvent[]> {
  try {
    return await bitget.fetchLiquidations(limit)
  } catch {
    return []
  }
}
