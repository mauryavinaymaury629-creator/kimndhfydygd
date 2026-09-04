import { EQUITY_USD, MAX_LEVERAGE, QTY_DECIMALS, RISK_PER_TRADE_PCT } from "./config"

/**
 * Simulated bracket order sizing — mirrors the Python OrderExecutionEngine's
 * risk-based position sizing. No real exchange credentials are ever used;
 * every trade opened from this terminal is SIMULATED for research/paper use.
 */
export function calculatePositionSize(entryPrice: number, stopLossPrice: number) {
  const riskUsd = EQUITY_USD * RISK_PER_TRADE_PCT
  const stopDist = Math.max(Math.abs(entryPrice - stopLossPrice), entryPrice * 0.001)
  const sizeXau = riskUsd / stopDist
  const maxSize = (EQUITY_USD * MAX_LEVERAGE) / entryPrice
  const finalSize = Math.min(sizeXau, maxSize)
  const factor = 10 ** QTY_DECIMALS
  return {
    qty: Math.round(finalSize * factor) / factor,
    stopDist,
  }
}
