import { NextResponse } from "next/server"
import { getDepth, getKlines, getLiquidations, getOpenInterest, getTicker, getTrades, lastSourceUsed } from "@/lib/terminal/exchanges/aggregator"
import { calculateMicroPrice, calculateRsi } from "@/lib/terminal/indicators"
import { generateScalpSignal } from "@/lib/terminal/scalp-engine"
import { serverState } from "@/lib/terminal/server-state"
import { INTERVAL, SYMBOL_DISPLAY } from "@/lib/terminal/config"
import type { MarketSnapshot } from "@/lib/terminal/types"

export const dynamic = "force-dynamic"

export async function GET() {
  const startedAt = Date.now()
  try {
    const [ticker, klines, depth, trades, liquidations, openInterest] = await Promise.all([
      getTicker(),
      getKlines(200),
      getDepth(20),
      getTrades(50),
      getLiquidations(30),
      getOpenInterest(),
    ])

    serverState.ingestTrades(trades)
    serverState.liquidationEngine.ingest(liquidations)

    const price = ticker.lastPrice || serverState.lastPrice
    serverState.lastPrice = price

    const liq = serverState.liquidationEngine.update(price, serverState.recentCvd5s)
    const scalpSignal = generateScalpSignal(klines, price)
    serverState.lastSignal = scalpSignal
    serverState.checkActiveTrade(price)

    const closes = klines.map((k) => k.close)
    const rsi = calculateRsi(closes)
    const microPrice = calculateMicroPrice(depth.bids, depth.asks)

    const topBid = depth.bids.slice(0, 10).reduce((s, [, q]) => s + q, 0)
    const topAsk = depth.asks.slice(0, 10).reduce((s, [, q]) => s + q, 0)
    const obImbalance = topBid + topAsk > 0 ? ((topBid - topAsk) / (topBid + topAsk)) * 100 : 0

    const direction =
      price > scalpSignal.indicators.ema9 && rsi < 60 ? "LONG" : price < scalpSignal.indicators.ema9 && rsi > 40 ? "SHORT" : "WAIT"

    const snapshot: MarketSnapshot = {
      symbol: SYMBOL_DISPLAY,
      interval: INTERVAL,
      utc: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      source: lastSourceUsed,
      latencyMs: Date.now() - startedAt,
      lastPrice: price,
      markPrice: ticker.markPrice || price,
      indexPrice: ticker.indexPrice || price,
      microPrice: microPrice || price,
      fundingRate: ticker.fundingRate,
      openInterest: ticker.openInterest || openInterest,
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      obImbalance: Math.round(obImbalance * 10) / 10,
      cvd: Math.round(serverState.cvd * 1000) / 1000,
      recentCvd5s: Math.round(serverState.recentCvd5s * 1000) / 1000,
      rsi: Math.round(rsi * 10) / 10,
      atr: scalpSignal.indicators.atr,
      vwap: scalpSignal.indicators.vwap,
      ema9: scalpSignal.indicators.ema9,
      ema21: scalpSignal.indicators.ema21,
      direction,
      scalpSignal,
      liq,
      bids: depth.bids.slice(0, 10),
      asks: depth.asks.slice(0, 10),
      tape: serverState.tape.slice(0, 12),
      klines,
      activeTrade: serverState.activeTrade,
      tradeHistory: serverState.tradeHistory,
    }

    return NextResponse.json(snapshot)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error fetching market data" }, { status: 502 })
  }
}
