import type { DepthSnapshot, KlineBar, TapeTrade, TickerSnapshot } from "../types"

const BASE = "https://contract.mexc.com"
const SYMBOL = "XAU_USDT"

async function getJson(url: string, timeoutMs = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
    if (!res.ok) throw new Error(`mexc ${res.status}`)
    const json = await res.json()
    if (!json.success) throw new Error(`mexc code ${json.code}`)
    return json.data
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchTicker(): Promise<TickerSnapshot> {
  const t = await getJson(`${BASE}/api/v1/contract/ticker?symbol=${SYMBOL}`)
  return {
    lastPrice: Number(t.lastPrice),
    markPrice: Number(t.fairPrice),
    indexPrice: Number(t.indexPrice),
    fundingRate: Number(t.fundingRate),
    openInterest: Number(t.holdVol),
    high24h: Number(t.high24Price),
    low24h: Number(t.lower24Price),
  }
}

export async function fetchOpenInterest(): Promise<number> {
  const t = await getJson(`${BASE}/api/v1/contract/ticker?symbol=${SYMBOL}`)
  return Number(t.holdVol)
}

export async function fetchKlines(limit = 200): Promise<KlineBar[]> {
  const data = await getJson(`${BASE}/api/v1/contract/kline/${SYMBOL}?interval=Min15`)
  const { time, open, high, low, close, vol } = data
  const n = time.length
  const start = Math.max(0, n - limit)
  const bars: KlineBar[] = []
  for (let i = start; i < n; i++) {
    bars.push({ time: time[i], open: open[i], high: high[i], low: low[i], close: close[i], volume: vol[i] })
  }
  return bars
}

export async function fetchDepth(limit = 20): Promise<DepthSnapshot> {
  const data = await getJson(`${BASE}/api/v1/contract/depth/${SYMBOL}?limit=${limit}`)
  return {
    bids: (data.bids as number[][]).slice(0, limit).map(([p, q]) => [Number(p), Number(q)]),
    asks: (data.asks as number[][]).slice(0, limit).map(([p, q]) => [Number(p), Number(q)]),
  }
}

export async function fetchTrades(limit = 50): Promise<TapeTrade[]> {
  const data = await getJson(`${BASE}/api/v1/contract/deals/${SYMBOL}?limit=${limit}`)
  return (data as any[]).map((t) => ({
    id: String(t.i),
    ts: Number(t.t),
    price: Number(t.p),
    qty: Number(t.v),
    side: t.T === 1 ? "BUY" : "SELL",
  }))
}

export const EXCHANGE_NAME = "MEXC"
