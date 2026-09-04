import type { ActiveTrade, ScalpSignal, TapeTrade } from "./types"
import { LiquidationCascadeEngine } from "./liquidation-engine"

/**
 * Process-lifetime singleton. Mirrors the role of `market_state` /
 * `liquidation_engine` module globals in the original Python terminal —
 * accumulates CVD, the trade tape, and liquidation cascade state across
 * polls so the terminal has real "memory" instead of recomputing from
 * scratch on every request.
 */
class ServerState {
  cvd = 0
  recentCvd5s = 0
  private tradeEvents5s: { ts: number; delta: number }[] = []
  private seenTradeIds = new Set<string>()
  tape: TapeTrade[] = []

  liquidationEngine = new LiquidationCascadeEngine()

  lastPrice = 0
  lastSignal: ScalpSignal | null = null

  activeTrade: ActiveTrade | null = null
  tradeHistory: ActiveTrade[] = []
  nextTradeId = 1

  ingestTrades(trades: TapeTrade[]) {
    // Exchange trade feeds arrive newest-first or oldest-first depending on
    // source; normalize to chronological order before folding into CVD.
    const chronological = [...trades].sort((a, b) => a.ts - b.ts)
    const fresh: TapeTrade[] = []
    for (const t of chronological) {
      if (this.seenTradeIds.has(t.id)) continue
      this.seenTradeIds.add(t.id)
      fresh.push(t)
    }
    if (this.seenTradeIds.size > 2000) {
      this.seenTradeIds = new Set(Array.from(this.seenTradeIds).slice(-1000))
    }

    const now = Date.now()
    for (const t of fresh) {
      const delta = t.side === "BUY" ? t.qty : -t.qty
      this.cvd += delta
      this.tradeEvents5s.push({ ts: now, delta })
    }

    const cutoff = now - 5000
    this.tradeEvents5s = this.tradeEvents5s.filter((e) => e.ts >= cutoff)
    this.recentCvd5s = this.tradeEvents5s.reduce((s, e) => s + e.delta, 0)

    if (fresh.length > 0) {
      this.tape = [...fresh.reverse(), ...this.tape].slice(0, 25)
    }
  }

  /** Checks the active simulated trade against the latest price for SL/TP hits. */
  checkActiveTrade(price: number) {
    const t = this.activeTrade
    if (!t || price <= 0) return
    const hitLong = t.side === "LONG"
    if (hitLong) {
      if (price <= t.stopLoss) this.closeTrade(price, "CLOSED_SL")
      else if (price >= t.tp2) this.closeTrade(price, "CLOSED_TP2")
      else if (price >= t.tp1 && t.status === "OPEN") this.closeTrade(price, "CLOSED_TP1", true)
    } else {
      if (price >= t.stopLoss) this.closeTrade(price, "CLOSED_SL")
      else if (price <= t.tp2) this.closeTrade(price, "CLOSED_TP2")
      else if (price <= t.tp1 && t.status === "OPEN") this.closeTrade(price, "CLOSED_TP1", true)
    }
  }

  private closeTrade(price: number, status: ActiveTrade["status"], partial = false) {
    const t = this.activeTrade
    if (!t) return
    const direction = t.side === "LONG" ? 1 : -1
    const pnlUsd = (price - t.entryPrice) * direction * t.qty
    t.status = status
    t.closedAt = Date.now()
    t.closedPrice = price
    t.pnlUsd = Math.round(pnlUsd * 100) / 100
    if (!partial) {
      this.tradeHistory = [t, ...this.tradeHistory].slice(0, 20)
      this.activeTrade = null
    }
    // Partial TP1 fills keep the position "open" conceptually in this simplified
    // model but we still record the milestone by snapshotting into history.
    if (partial) {
      this.tradeHistory = [{ ...t }, ...this.tradeHistory].slice(0, 20)
    }
  }

  openTrade(trade: Omit<ActiveTrade, "id" | "openedAt" | "status">) {
    if (this.activeTrade) return null
    const t: ActiveTrade = {
      ...trade,
      id: String(this.nextTradeId++),
      openedAt: Date.now(),
      status: "OPEN",
    }
    this.activeTrade = t
    return t
  }

  closeActiveManually(price: number) {
    if (!this.activeTrade) return null
    this.closeTrade(price, "CLOSED_MANUAL")
    return this.tradeHistory[0] ?? null
  }
}

const globalForState = globalThis as unknown as { __xauTerminalState?: ServerState }

export const serverState = globalForState.__xauTerminalState ?? new ServerState()
globalForState.__xauTerminalState = serverState
