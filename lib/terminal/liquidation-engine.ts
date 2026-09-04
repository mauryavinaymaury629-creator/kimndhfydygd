import type { LiqState, LiquidationEvent, LiquidationStats } from "./types"
import { CASCADE_THRESHOLD_USD, VELOCITY_THRESHOLD_USD_S } from "./config"

/**
 * Port of the Python LiquidationEngine state machine:
 * IDLE -> ARMED (cascade burst detected) -> EXHAUSTING (velocity fading) ->
 * TRIGGERED (CVD confirms capitulation/squeeze) -> back to IDLE on timeout.
 */
export class LiquidationCascadeEngine {
  private windowSec = 60
  private events: LiquidationEvent[] = []
  private seenKeys = new Set<string>()
  state: LiqState = "IDLE"
  private armedAt = 0
  private peakVelocity = 0
  private cascadeSide: "LONG_LIQ" | "SHORT_LIQ" | null = null
  private wickExtreme = 0

  ingest(events: LiquidationEvent[]) {
    for (const e of events) {
      const key = `${e.ts}-${e.price}-${e.qty}-${e.side}`
      if (this.seenKeys.has(key)) continue
      this.seenKeys.add(key)
      this.events.push(e)
    }
    if (this.seenKeys.size > 500) {
      // keep the set from growing unbounded
      this.seenKeys = new Set(Array.from(this.seenKeys).slice(-300))
    }
    this.prune(Date.now())
  }

  private prune(nowMs: number) {
    const cutoff = nowMs - this.windowSec * 1000
    this.events = this.events.filter((e) => e.ts >= cutoff)
  }

  update(currentPrice: number, recentCvdDelta: number): LiquidationStats {
    const now = Date.now()
    this.prune(now)

    const cutoff10s = now - 10_000
    const long10s = this.events.filter((e) => e.ts >= cutoff10s && e.side === "SELL").reduce((s, e) => s + e.usd, 0)
    const short10s = this.events.filter((e) => e.ts >= cutoff10s && e.side === "BUY").reduce((s, e) => s + e.usd, 0)
    const velocity = (long10s + short10s) / 10.0

    let action: LiquidationStats["action"] = null

    if (this.state === "IDLE") {
      if (long10s >= CASCADE_THRESHOLD_USD && velocity >= VELOCITY_THRESHOLD_USD_S) {
        this.state = "ARMED"
        this.cascadeSide = "LONG_LIQ"
        this.armedAt = now
        this.peakVelocity = velocity
        this.wickExtreme = currentPrice
      } else if (short10s >= CASCADE_THRESHOLD_USD && velocity >= VELOCITY_THRESHOLD_USD_S) {
        this.state = "ARMED"
        this.cascadeSide = "SHORT_LIQ"
        this.armedAt = now
        this.peakVelocity = velocity
        this.wickExtreme = currentPrice
      }
    } else if (this.state === "ARMED") {
      this.peakVelocity = Math.max(this.peakVelocity, velocity)
      if (this.cascadeSide === "LONG_LIQ") {
        this.wickExtreme = Math.min(this.wickExtreme, currentPrice)
      } else {
        this.wickExtreme = Math.max(this.wickExtreme, currentPrice)
      }
      if (velocity < this.peakVelocity * 0.5) this.state = "EXHAUSTING"
      if (now - this.armedAt > 20_000) this.state = "IDLE"
    } else if (this.state === "EXHAUSTING") {
      if (this.cascadeSide === "LONG_LIQ" && recentCvdDelta > 0.5) {
        action = "BUY_CAPITULATION"
        this.state = "TRIGGERED"
      } else if (this.cascadeSide === "SHORT_LIQ" && recentCvdDelta < -0.5) {
        action = "SELL_SQUEEZE"
        this.state = "TRIGGERED"
      }
      if (now - this.armedAt > 25_000) this.state = "IDLE"
    } else if (this.state === "TRIGGERED") {
      if (now - this.armedAt > 30_000) this.state = "IDLE"
    }

    return {
      state: this.state,
      side: this.cascadeSide,
      velocity: Math.round(velocity * 100) / 100,
      peakVelocity: Math.round(this.peakVelocity * 100) / 100,
      long10s: Math.round(long10s * 100) / 100,
      short10s: Math.round(short10s * 100) / 100,
      wickExtreme: Math.round(this.wickExtreme * 100) / 100,
      action,
    }
  }
}
