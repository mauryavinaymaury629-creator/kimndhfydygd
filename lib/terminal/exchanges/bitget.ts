import type { DepthSnapshot, KlineBar, LiquidationEvent, TapeTrade, TickerSnapshot } from "../types"

const BASE = "https://api.bitget.com"
const SYMBOL = "XAUUSDT"
const PRODUCT_TYPE = "usdt-futures"

async function getJson(url: string, timeoutMs = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
    if (!res.ok) throw new Error(`bitget ${res.status}`)
    const json = await res.json()
    if (json.code !== "00000") throw new Error(`bitget code ${json.code}`)
    return json.data
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchTicker(): Promise<TickerSnapshot> {
  const data = await getJson(`${BASE}/api/v2/mix/market/ticker?symbol=${SYMBOL}&productType=${PRODUCT_TYPE}`)
  const t = Array.isArray(data) ? data[0] : data
  return {
    lastPrice: Number(t.lastPr),
    markPrice: Number(t.markPrice),
    indexPrice: Number(t.indexPrice),
    fundingRate: Number(t.fundingRate),
    openInterest: 0,
    high24h: Number(t.high24h),
    low24h: Number(t.low24h),
  }
}

export async function fetchOpenInterest(): Promise<number> {
  const data = await getJson(`${BASE}/api/v2/mix/market/open-interest?symbol=${SYMBOL}&productType=${PRODUCT_TYPE}`)
  const item = data.openInterestList?.[0]
  return item ? Number(item.size) : 0
}

export async function fetchKlines(limit = 200): Promise<KlineBar[]> {
  const data = await getJson(
    `${BASE}/api/v2/mix/market/candles?symbol=${SYMBOL}&productType=${PRODUCT_TYPE}&granularity=15m&limit=${limit}`,
  )
  return (data as string[][])
    .map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
    }))
    .sort((a, b) => a.time - b.time)
}

export async function fetchDepth(limit = 20): Promise<DepthSnapshot> {
  const data = await getJson(`${BASE}/api/v2/mix/market/merge-depth?symbol=${SYMBOL}&productType=${PRODUCT_TYPE}&limit=${limit}`)
  return {
    bids: (data.bids as string[][]).map(([p, q]) => [Number(p), Number(q)]),
    asks: (data.asks as string[][]).map(([p, q]) => [Number(p), Number(q)]),
  }
}

export async function fetchTrades(limit = 50): Promise<TapeTrade[]> {
  const data = await getJson(`${BASE}/api/v2/mix/market/fills?symbol=${SYMBOL}&productType=${PRODUCT_TYPE}&limit=${limit}`)
  return (data as any[]).map((t) => ({
    id: String(t.tradeId),
    ts: Number(t.ts),
    price: Number(t.price),
    qty: Number(t.size),
    side: t.side === "buy" ? "BUY" : "SELL",
  }))
}

export async function fetchLiquidations(limit = 30): Promise<LiquidationEvent[]> {
  const data = await getJson(`${BASE}/api/v3/market/liquidations?category=USDT-FUTURES&symbol=${SYMBOL}&limit=${limit}`)
  const list = data?.list ?? []
  return (list as any[]).map((l) => {
    const price = Number(l.price)
    const qty = Number(l.amount)
    return {
      ts: Number(l.ts),
      side: l.side === "buy" ? "BUY" : "SELL",
      price,
      qty,
      usd: price * qty,
    }
  })
}

export const EXCHANGE_NAME = "BITGET"
