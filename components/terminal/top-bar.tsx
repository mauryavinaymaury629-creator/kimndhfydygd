import { fmtPct, fmtPrice } from "@/lib/terminal/format"
import type { MarketSnapshot } from "@/lib/terminal/types"
import { Badge } from "./panel"

export function TopBar({ data, connected }: { data: MarketSnapshot | undefined; connected: boolean }) {
  const changePct =
    data && data.high24h > 0 ? ((data.lastPrice - (data.high24h + data.low24h) / 2) / data.lastPrice) * 100 : 0

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-[#0d0f16] via-[#141821] to-[#0d0f16] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-gold text-[13px] font-black text-gold-foreground">
            X
          </span>
          <span className="text-sm font-black tracking-wide text-foreground">XAU SCALP TERMINAL</span>
        </div>
        <span className="rounded-sm bg-white/5 px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
          {data?.symbol ?? "XAU/USDT"}
        </span>
        <span className="rounded-sm bg-white/5 px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
          {data?.interval ?? "15m"} PERP
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <div className="tabular flex items-baseline gap-1.5">
          <span className="text-lg font-black text-gold">{fmtPrice(data?.lastPrice)}</span>
          <span className={changePct >= 0 ? "text-long" : "text-short"}>{fmtPct(changePct)}</span>
        </div>
        <span className="hidden text-muted-foreground sm:inline">{data?.utc ?? "--:--:-- UTC"}</span>
        <span className="hidden text-muted-foreground md:inline">Latency: {data?.latencyMs ?? "--"}ms</span>
        <span className="hidden text-muted-foreground md:inline">Feed: {data?.source ?? "--"}</span>
        <Badge tone={connected ? "long" : "short"}>{connected ? "Connected" : "Disconnected"}</Badge>
      </div>
    </header>
  )
}
