import { fmtPct, fmtPrice, fmtQty, fmtSigned } from "@/lib/terminal/format"
import type { MarketSnapshot } from "@/lib/terminal/types"
import { Badge, Metric, Panel } from "./panel"

export function MarketRadar({ data }: { data: MarketSnapshot | undefined }) {
  const dirTone = data?.direction === "LONG" ? "long" : data?.direction === "SHORT" ? "short" : "neutral"

  return (
    <Panel title="Market Radar" right={<Badge tone={dirTone as any}>{data?.direction ?? "WAIT"}</Badge>} bodyClassName="p-2">
      <div className="grid grid-cols-2 gap-1.5">
        <Metric label="Last Price" value={fmtPrice(data?.lastPrice)} valueClassName="text-gold" />
        <Metric label="Micro Price" value={fmtPrice(data?.microPrice)} />
        <Metric label="Mark / Index" value={`${fmtPrice(data?.markPrice)} / ${fmtPrice(data?.indexPrice)}`} />
        <Metric
          label="RSI (14)"
          value={data?.rsi ?? "--"}
          valueClassName={data && (data.rsi >= 70 || data.rsi <= 30) ? "text-warn" : undefined}
        />
        <Metric label="ATR (14)" value={fmtPrice(data?.atr)} />
        <Metric label="VWAP" value={fmtPrice(data?.vwap)} />
        <Metric label="EMA 9 / 21" value={`${fmtPrice(data?.ema9)} / ${fmtPrice(data?.ema21)}`} />
        <Metric
          label="5s CVD"
          value={`${fmtSigned(data?.recentCvd5s, 3)} XAU`}
          valueClassName={data && data.recentCvd5s >= 0 ? "text-long" : "text-short"}
        />
        <Metric
          label="Total CVD"
          value={`${fmtSigned(data?.cvd, 2)} XAU`}
          valueClassName={data && data.cvd >= 0 ? "text-long" : "text-short"}
        />
        <Metric label="Funding (8h)" value={data ? fmtPct(data.fundingRate * 100, 4) : "--"} />
        <Metric label="Open Interest" value={`${fmtQty(data?.openInterest, 0)} XAU`} />
        <Metric label="24h Range" value={`${fmtPrice(data?.low24h)} – ${fmtPrice(data?.high24h)}`} />
      </div>
    </Panel>
  )
}
