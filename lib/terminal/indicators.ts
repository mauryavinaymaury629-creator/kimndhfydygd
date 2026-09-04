import type { KlineBar, OrderBookLevel } from "./types"

export function calculateEma(data: number[], period: number): number {
  if (data.length === 0) return 0
  if (data.length < period) return data[data.length - 1]
  const alpha = 2 / (period + 1)
  let ema = data[0]
  for (let i = 1; i < data.length; i++) {
    ema = alpha * data[i] + (1 - alpha) * ema
  }
  return ema
}

export function calculateRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  const deltas: number[] = []
  for (let i = 1; i < closes.length; i++) deltas.push(closes[i] - closes[i - 1])
  const gains = deltas.map((d) => (d > 0 ? d : 0))
  const losses = deltas.map((d) => (d < 0 ? -d : 0))

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  for (let i = period; i < deltas.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function calculateAtr(closes: number[], highs: number[], lows: number[], period = 14): number {
  if (closes.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])))
  }
  let atr = trs[0]
  for (let i = 1; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period
  }
  return atr
}

export function calculateVwap(klines: KlineBar[]): number {
  if (klines.length === 0) return 0
  let cumPv = 0
  let cumVol = 0
  for (const k of klines) {
    const typical = (k.high + k.low + k.close) / 3
    cumPv += typical * k.volume
    cumVol += k.volume
  }
  return cumVol > 0 ? cumPv / cumVol : 0
}

export function calculateMicroPrice(bids: OrderBookLevel[], asks: OrderBookLevel[]): number {
  if (bids.length === 0 || asks.length === 0) return 0
  const [bestBid, bidQty] = bids[0]
  const [bestAsk, askQty] = asks[0]
  const totalQty = bidQty + askQty
  if (totalQty === 0) return (bestBid + bestAsk) / 2
  return bestBid * (askQty / totalQty) + bestAsk * (bidQty / totalQty)
}

/** Recent swing low/high over the last `lookback` closed candles. */
export function swingWindow(klines: KlineBar[], lookback = 8): { swingLow: number; swingHigh: number } {
  const n = Math.min(lookback, klines.length)
  if (n < 2) return { swingLow: 0, swingHigh: 0 }
  const window = klines.slice(-n)
  const lows = window.map((k) => k.low)
  const highs = window.map((k) => k.high)
  return { swingLow: Math.min(...lows), swingHigh: Math.max(...highs) }
}
