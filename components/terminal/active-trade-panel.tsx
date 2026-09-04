"use client"

import { useState } from "react"
import { fmtPrice, fmtQty, fmtSigned } from "@/lib/terminal/format"
import type { ActiveTrade, MarketSnapshot } from "@/lib/terminal/types"
import { Badge, Panel } from "./panel"

export function ActiveTradePanel({
  data,
  onTradeComplete,
  className,
}: {
  data: MarketSnapshot | undefined
  onTradeComplete: () => void
  className?: string
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const trade = data?.activeTrade ?? null
  const livePrice = data?.lastPrice ?? 0

  const unrealized = trade
    ? (livePrice - trade.entryPrice) * (trade.side === "LONG" ? 1 : -1) * trade.qty
    : 0

  async function sendAction(body: Record<string, unknown>) {
    setPending(true)
    setMessage(null)
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error ?? "Trade action failed")
      } else {
        setMessage(json.status === "CLOSED_MANUAL" ? "Position closed" : "Bracket order simulated")
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error")
    } finally {
      setPending(false)
      onTradeComplete()
    }
  }

  return (
    <Panel
      title="Active Trade"
      className={className}
      right={
        trade ? (
          <Badge tone={trade.side === "LONG" ? "long" : "short"}>{trade.side} OPEN</Badge>
        ) : (
          <Badge tone="idle">FLAT</Badge>
        )
      }
      bodyClassName="flex flex-col gap-2 p-2.5 overflow-y-auto scrollbar-thin"
    >
      {trade ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label="Entry" value={fmtPrice(trade.entryPrice)} />
            <Stat label="Qty" value={`${fmtQty(trade.qty)} XAU`} />
            <Stat
              label="Unrealized P/L"
              value={`${fmtSigned(unrealized, 2)} USD`}
              valueClassName={unrealized >= 0 ? "text-long" : "text-short"}
            />
            <Stat label="Stop Loss" value={fmtPrice(trade.stopLoss)} valueClassName="text-short" />
            <Stat label="TP1" value={fmtPrice(trade.tp1)} valueClassName="text-long" />
            <Stat label="TP2" value={fmtPrice(trade.tp2)} valueClassName="text-long" />
          </div>
          <button
            disabled={pending}
            onClick={() => sendAction({ action: "close" })}
            className="rounded-sm bg-secondary px-3 py-1.5 text-[12px] font-bold text-secondary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            Close Position
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          <button
            disabled={pending || livePrice <= 0}
            onClick={() => sendAction({ action: "open", side: "LONG" })}
            className="flex-1 rounded-sm bg-long px-3 py-2 text-[12px] font-bold text-long-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            BUY / LONG
          </button>
          <button
            disabled={pending || livePrice <= 0}
            onClick={() => sendAction({ action: "open", side: "SHORT" })}
            className="flex-1 rounded-sm bg-short px-3 py-2 text-[12px] font-bold text-short-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            SELL / SHORT
          </button>
        </div>
      )}
      {message && <p className="text-[11px] text-muted-foreground">{message}</p>}
      <p className="text-[10px] text-muted-foreground">
        SIMULATED bracket execution — sizing from {(0.01 * 100).toFixed(0)}% equity risk. No real orders are sent.
      </p>
      <TradeHistory history={data?.tradeHistory ?? []} />
    </Panel>
  )
}

function Stat({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-sm bg-white/[0.03] px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`tabular text-[12px] font-bold text-foreground ${valueClassName ?? ""}`}>{value}</div>
    </div>
  )
}

function TradeHistory({ history }: { history: ActiveTrade[] }) {
  if (history.length === 0) return null
  return (
    <div className="border-t border-border pt-2">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Closes</div>
      <div className="flex flex-col gap-1">
        {history.slice(0, 4).map((t) => (
          <div key={`${t.id}-${t.closedAt}`} className="flex items-center justify-between text-[11px]">
            <span className={t.side === "LONG" ? "text-long" : "text-short"}>{t.side}</span>
            <span className="tabular text-muted-foreground">
              {fmtPrice(t.entryPrice)} → {fmtPrice(t.closedPrice)}
            </span>
            <span className={`tabular font-semibold ${(t.pnlUsd ?? 0) >= 0 ? "text-long" : "text-short"}`}>
              {fmtSigned(t.pnlUsd, 2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
