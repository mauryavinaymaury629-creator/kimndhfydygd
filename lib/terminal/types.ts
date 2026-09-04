export interface KlineBar {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type OrderBookLevel = [price: number, qty: number]

export interface DepthSnapshot {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface TickerSnapshot {
  lastPrice: number
  markPrice: number
  indexPrice: number
  fundingRate: number
  openInterest: number
  high24h: number
  low24h: number
}

export type TradeSide = "BUY" | "SELL"

export interface TapeTrade {
  id: string
  ts: number // ms
  price: number
  qty: number
  side: TradeSide
}

export interface LiquidationEvent {
  ts: number // ms
  side: TradeSide // side of the liquidated position being force-closed
  price: number
  qty: number
  usd: number
}

export type LiqState = "IDLE" | "ARMED" | "EXHAUSTING" | "TRIGGERED"

export interface LiquidationStats {
  state: LiqState
  side: "LONG_LIQ" | "SHORT_LIQ" | null
  velocity: number
  peakVelocity: number
  long10s: number
  short10s: number
  wickExtreme: number
  action: "BUY_CAPITULATION" | "SELL_SQUEEZE" | null
}

export type SignalDirection = "LONG" | "SHORT" | "WAIT"

export interface EntryZone {
  key: "aggressive" | "ema9" | "vwap"
  label: string
  price: number
  distance: number // $ distance from current price
  distancePct: number
}

export interface TargetLevel {
  label: string
  price: number
  rr: number
}

export interface ScalpSignal {
  signal: SignalDirection
  side: "LONG" | "SHORT" | null
  price: number
  idealEntry: number
  entryZones: EntryZone[]
  stopLoss: number
  targets: TargetLevel[]
  swingLow: number
  swingHigh: number
  distanceToEma9: number
  distanceToEma9Pct: number
  distanceToVwap: number
  distanceToVwapPct: number
  extended: boolean
  limitOrderHint: string | null
  reason: string
  indicators: {
    ema9: number
    ema21: number
    vwap: number
    atr: number
    rsi: number
  }
}

export interface ActiveTrade {
  id: string
  side: "LONG" | "SHORT"
  entryPrice: number
  qty: number
  stopLoss: number
  tp1: number
  tp2: number
  openedAt: number
  status: "OPEN" | "CLOSED_TP1" | "CLOSED_TP2" | "CLOSED_SL" | "CLOSED_MANUAL"
  closedAt?: number
  closedPrice?: number
  pnlUsd?: number
}

export interface MarketSnapshot {
  symbol: string
  interval: string
  utc: string
  source: string
  latencyMs: number
  lastPrice: number
  markPrice: number
  indexPrice: number
  microPrice: number
  fundingRate: number
  openInterest: number
  high24h: number
  low24h: number
  obImbalance: number
  cvd: number
  recentCvd5s: number
  rsi: number
  atr: number
  vwap: number
  ema9: number
  ema21: number
  direction: SignalDirection
  scalpSignal: ScalpSignal
  liq: LiquidationStats
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  tape: TapeTrade[]
  klines: KlineBar[]
  activeTrade: ActiveTrade | null
  tradeHistory: ActiveTrade[]
}
