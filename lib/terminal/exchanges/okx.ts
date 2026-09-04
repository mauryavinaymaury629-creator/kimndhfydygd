import type { DepthSnapshot, KlineBar, TapeTrade, TickerSnapshot } from "../types"

const BASE = "https://www.okx.com"
const INST_ID = "XAU-USDT-SWAP"

async function getJson(url: string, timeoutMs = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
    if (!res.ok) throw new Error(`okx ${res.status}`)
    const json = await res.json()
    if (json.code !== "0") throw new Error(`okx code ${json.code}`)
    return json.data
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchTicker(): Promise<TickerSnapshot> {
  const data = await getJson(`${BASE}/api/v5/market/ticker?instId=${INST_ID}`)
  const t = data[0]
  return {
    lastPrice: Number(t.last),
    markPrice: Number(t.last),
    indexPrice: Number(t.last),
    fundingRate: 0,
    openInterest: 0,
    high24h: Number(t.high24h),
    low24h: Number(t.low24h),
  }
}

export async function fetchOpenInterest(): Promise<number> {
  const data = await getJson(`${BASE}/api/v5/public/open-interest?instId=${INST_ID}`)
  return Number(data[0]?.oiCcy ?? 0)
}

export async function fetchKlines(limit = 200): Promise<KlineBar[]> {
  const data = await getJson(`${BASE}/api/v5/market/candles?instId=${INST_ID}&bar=15m&limit=${limit}`)
  return (data as string[][])
    .map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[6]),
    }))
    .sort((a, b) => a.time - b.time)
}

export async function fetchDepth(limit = 20): Promise<DepthSnapshot> {
  const data = await getJson(`${BASE}/api/v5/market/books?instId=${INST_ID}&sz=${limit}`)
  const book = data[0]
  return {
    bids: (book.bids as string[][]).map(([p, q]) => [Number(p), Number(q)]),
    asks: (book.asks as string[][]).map(([p, q]) => [Number(p), Number(q)]),
  }
}

export async function fetchTrades(limit = 50): Promise<TapeTrade[]> {
  const data = await getJson(`${BASE}/api/v5/market/trades?instId=${INST_ID}&limit=${limit}`)
  return (data as any[]).map((t) => ({
    id: String(t.tradeId),
    ts: Number(t.ts),
    price: Number(t.px),
    qty: Number(t.sz),
    side: t.side === "buy" ? "BUY" : "SELL",
  }))
}

export const EXCHANGE_NAME = "OKX"
