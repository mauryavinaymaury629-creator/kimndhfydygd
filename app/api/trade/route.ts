import { NextResponse } from "next/server"
import { serverState } from "@/lib/terminal/server-state"
import { calculatePositionSize } from "@/lib/terminal/trade-manager"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const action = body?.action as "open" | "close" | undefined
  const price = serverState.lastPrice

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 })
  }

  if (action === "close") {
    const closed = serverState.closeActiveManually(price)
    if (!closed) return NextResponse.json({ error: "No active trade to close" }, { status: 400 })
    return NextResponse.json({ status: "CLOSED_MANUAL", trade: closed })
  }

  if (action === "open") {
    const side = body?.side === "SHORT" ? "SHORT" : "LONG"
    if (price <= 0) return NextResponse.json({ error: "No live price available" }, { status: 400 })
    if (serverState.activeTrade) {
      return NextResponse.json({ error: "A trade is already active — close it before opening another" }, { status: 409 })
    }

    const signal = serverState.lastSignal
    const useSignalLevels = signal && signal.side === side
    const fallbackDist = Math.max(price * 0.0025, 2)

    const stopLoss = useSignalLevels ? signal.stopLoss : side === "LONG" ? price - fallbackDist : price + fallbackDist
    const tp1 = useSignalLevels ? signal.targets[0]?.price : side === "LONG" ? price + fallbackDist * 1.5 : price - fallbackDist * 1.5
    const tp2 = useSignalLevels ? signal.targets[1]?.price : side === "LONG" ? price + fallbackDist * 3 : price - fallbackDist * 3

    const { qty } = calculatePositionSize(price, stopLoss)

    const trade = serverState.openTrade({
      side,
      entryPrice: price,
      qty,
      stopLoss,
      tp1: tp1 ?? price,
      tp2: tp2 ?? price,
    })

    if (!trade) return NextResponse.json({ error: "A trade is already active" }, { status: 409 })
    return NextResponse.json({ status: "SIMULATED_SUCCESS", trade })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
