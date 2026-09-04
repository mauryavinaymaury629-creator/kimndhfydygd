import type { EntryZone, KlineBar, ScalpSignal, TargetLevel } from "./types"
import { calculateAtr, calculateEma, calculateRsi, calculateVwap, swingWindow } from "./indicators"
import {
  EXTENDED_ATR_MULT,
  RSI_EXTREME_OVERBOUGHT,
  RSI_EXTREME_OVERSOLD,
  RSI_OVERBOUGHT,
  RSI_OVERSOLD,
  SWING_LOOKBACK,
} from "./config"

const WAIT_SIGNAL: ScalpSignal = {
  signal: "WAIT",
  side: null,
  price: 0,
  idealEntry: 0,
  entryZones: [],
  stopLoss: 0,
  targets: [],
  swingLow: 0,
  swingHigh: 0,
  distanceToEma9: 0,
  distanceToEma9Pct: 0,
  distanceToVwap: 0,
  distanceToVwapPct: 0,
  extended: false,
  limitOrderHint: null,
  reason: "Insufficient 15m history",
  indicators: { ema9: 0, ema21: 0, vwap: 0, atr: 0, rsi: 50 },
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * Enhanced 15m XAU/USDT scalp signal generator.
 *
 * Always computes three candidate entry zones (Aggressive / EMA9 / VWAP) even
 * when the overall signal is WAIT, so the trader always knows where the next
 * limit order should sit. Ideal entry for LONG = the LOWEST of the three
 * zones; ideal entry for SHORT = the HIGHEST of the three zones. Conditions
 * are relaxed relative to a strict trend-only model — RSI extreme readings
 * and simple proximity to a zone are enough to flip WAIT into an actionable
 * signal, so the terminal produces signals more often.
 */
export function generateScalpSignal(klines: KlineBar[], livePrice: number): ScalpSignal {
  if (klines.length < 30) return WAIT_SIGNAL

  const closes = klines.map((k) => k.close)
  const highs = klines.map((k) => k.high)
  const lows = klines.map((k) => k.low)

  const ema9 = calculateEma(closes, 9)
  const ema21 = calculateEma(closes, 21)
  const vwap = calculateVwap(klines)
  const atr = calculateAtr(closes, highs, lows, 14)
  const rsi = calculateRsi(closes, 14)
  const { swingLow, swingHigh } = swingWindow(klines, SWING_LOOKBACK)

  const price = livePrice || closes[closes.length - 1]

  const bullishTrend = ema9 > ema21
  const bearishTrend = ema9 < ema21

  // Bias always resolves to LONG or SHORT so zones can always be computed —
  // ties and RSI extremes break in favor of the mean-reversion side.
  let bias: "LONG" | "SHORT" = bullishTrend ? "LONG" : bearishTrend ? "SHORT" : "LONG"
  if (rsi <= RSI_EXTREME_OVERSOLD) bias = "LONG"
  else if (rsi >= RSI_EXTREME_OVERBOUGHT) bias = "SHORT"

  const aggressiveRaw = bias === "LONG" ? price - 0.15 * atr : price + 0.15 * atr

  const rawZones: { key: EntryZone["key"]; label: string; raw: number }[] = [
    { key: "aggressive", label: "Aggressive", raw: aggressiveRaw },
    { key: "ema9", label: "EMA9", raw: ema9 },
    { key: "vwap", label: "VWAP", raw: vwap },
  ]

  const zonePrices: number[] = []
  const entryZones: EntryZone[] = rawZones.map((z) => {
    let clamped: number
    if (bias === "LONG") {
      clamped = Math.max(Math.min(z.raw, price), swingLow)
    } else {
      clamped = Math.min(Math.max(z.raw, price), swingHigh)
    }
    zonePrices.push(clamped)
    return {
      key: z.key,
      label: z.label,
      price: round2(clamped),
      distance: round2(price - clamped),
      distancePct: price !== 0 ? round2(((price - clamped) / price) * 100) : 0,
    }
  })

  // Ideal entry: lowest zone for LONG (cheapest buy), highest zone for SHORT (best sell).
  const idealEntry = bias === "LONG" ? Math.min(...zonePrices) : Math.max(...zonePrices)

  const zoneTolRelaxed = 1.0 * atr // relaxed proximity tolerance (was 0.5*ATR in the strict model)
  const nearAnyZone = zonePrices.some((z) => Math.abs(price - z) <= zoneTolRelaxed)
  const nearSwingLow = Math.abs(price - swingLow) <= zoneTolRelaxed
  const nearSwingHigh = Math.abs(price - swingHigh) <= zoneTolRelaxed

  let signal: ScalpSignal["signal"] = "WAIT"
  let reason = "No clear 15m trend"

  if (bias === "LONG") {
    if (bullishTrend && rsi < RSI_OVERBOUGHT && nearAnyZone) {
      signal = "LONG"
      reason = "Price at 15m buy zone (Aggressive/EMA9/VWAP), bullish trend"
    } else if (rsi <= RSI_EXTREME_OVERSOLD && (nearAnyZone || nearSwingLow)) {
      signal = "LONG"
      reason = "RSI oversold extreme near demand zone — reversion long"
    } else if (bullishTrend) {
      reason = "Bullish trend; wait for pullback to a buy zone"
    } else {
      reason = "Oversold but no zone proximity yet"
    }
  } else {
    if (bearishTrend && rsi > RSI_OVERSOLD && nearAnyZone) {
      signal = "SHORT"
      reason = "Price at 15m sell zone (Aggressive/EMA9/VWAP), bearish trend"
    } else if (rsi >= RSI_EXTREME_OVERBOUGHT && (nearAnyZone || nearSwingHigh)) {
      signal = "SHORT"
      reason = "RSI overbought extreme near supply zone — reversion short"
    } else if (bearishTrend) {
      reason = "Bearish trend; wait for rally to a sell zone"
    } else {
      reason = "Overbought but no zone proximity yet"
    }
  }

  const slDist = Math.max(atr * 1.2, price * 0.0015)
  const stopLoss = bias === "LONG" ? Math.min(swingLow, idealEntry - slDist) : Math.max(swingHigh, idealEntry + slDist)
  const risk = Math.abs(idealEntry - stopLoss)

  const tp1Dist = risk * 1.5
  const tp2Dist = risk * 3.0
  const tp1 = bias === "LONG" ? idealEntry + tp1Dist : idealEntry - tp1Dist
  const tp2 = bias === "LONG" ? idealEntry + tp2Dist : idealEntry - tp2Dist

  const targets: TargetLevel[] = [
    { label: "TP1", price: round2(tp1), rr: risk > 0 ? round2(tp1Dist / risk) : 0 },
    { label: "TP2", price: round2(tp2), rr: risk > 0 ? round2(tp2Dist / risk) : 0 },
  ]

  const distFromIdeal = Math.abs(price - idealEntry)
  const extended = distFromIdeal > EXTENDED_ATR_MULT * atr
  const limitOrderHint = extended
    ? `Price is extended $${distFromIdeal.toFixed(2)} from the ideal ${bias} entry — place a ${
        bias === "LONG" ? "BUY LIMIT" : "SELL LIMIT"
      } order at $${idealEntry.toFixed(2)} and wait for the fill.`
    : null

  return {
    signal,
    side: bias,
    price: round2(price),
    idealEntry: round2(idealEntry),
    entryZones,
    stopLoss: round2(stopLoss),
    targets,
    swingLow: round2(swingLow),
    swingHigh: round2(swingHigh),
    distanceToEma9: round2(price - ema9),
    distanceToEma9Pct: price !== 0 ? round2(((price - ema9) / price) * 100) : 0,
    distanceToVwap: round2(price - vwap),
    distanceToVwapPct: price !== 0 ? round2(((price - vwap) / price) * 100) : 0,
    extended,
    limitOrderHint,
    reason,
    indicators: {
      ema9: round2(ema9),
      ema21: round2(ema21),
      vwap: round2(vwap),
      atr: round2(atr),
      rsi: round2(rsi),
    },
  }
}
