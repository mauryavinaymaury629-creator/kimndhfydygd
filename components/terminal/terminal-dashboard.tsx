"use client"

import { useMarketData } from "@/hooks/use-market-data"
import { ActiveTradePanel } from "./active-trade-panel"
import { LiquidationMonitor } from "./liquidation-monitor"
import { MarketRadar } from "./market-radar"
import { OrderBook } from "./order-book"
import { Panel } from "./panel"
import { PriceChart } from "./price-chart"
import { ScalpSignalPanel } from "./scalp-signal-panel"
import { TradeTape } from "./trade-tape"
import { TopBar } from "./top-bar"

export function TerminalDashboard() {
  const { data, error, mutate } = useMarketData()
  const connected = !error && !!data

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar data={data} connected={connected} />

      <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden">
        {/* Left column: chart + active trade + scalp signal */}
        <div className="flex shrink-0 flex-col gap-2 lg:min-h-0 lg:shrink lg:overflow-hidden">
          <Panel title={`${data?.symbol ?? "XAU/USDT"} 15m Candles`} className="h-[320px] shrink-0 lg:h-auto lg:flex-[1.4] lg:min-h-0">
            <div className="h-full w-full p-1">
              <PriceChart klines={data?.klines ?? []} signal={data?.scalpSignal ?? null} />
            </div>
          </Panel>

          <div className="flex shrink-0 flex-col gap-2 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-2 lg:overflow-hidden">
            <ScalpSignalPanel signal={data?.scalpSignal} className="shrink-0 lg:h-full lg:overflow-hidden" />
            <ActiveTradePanel data={data} onTradeComplete={() => mutate()} className="shrink-0 lg:h-full lg:overflow-hidden" />
          </div>
        </div>

        {/* Right column: radar, liquidation monitor, book, tape */}
        <div className="flex shrink-0 flex-col gap-2 lg:min-h-0 lg:shrink lg:overflow-hidden">
          <MarketRadar data={data} />
          <LiquidationMonitor liq={data?.liq} />
          <div className="h-[280px] shrink-0 lg:h-auto lg:min-h-[200px] lg:flex-1 lg:overflow-hidden">
            <OrderBook bids={data?.bids ?? []} asks={data?.asks ?? []} imbalance={data?.obImbalance ?? 0} />
          </div>
          <div className="h-[280px] shrink-0 lg:h-auto lg:min-h-[200px] lg:flex-1 lg:overflow-hidden">
            <TradeTape trades={data?.tape ?? []} />
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-[#08110c] px-3 py-1.5 text-center text-[10px] font-medium text-long">
        Live public futures data from Bitget / MEXC / OKX with automatic failover — no dummy data. Trading buttons are
        SIMULATED unless real execution is wired in.
      </footer>
    </div>
  )
}
