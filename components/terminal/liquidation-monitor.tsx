import { fmtCompactUsd, fmtPrice } from "@/lib/terminal/format"
import type { LiquidationStats } from "@/lib/terminal/types"
import { Badge, Metric, Panel } from "./panel"

const STATE_TONE: Record<LiquidationStats["state"], "idle" | "warn" | "short" | "long"> = {
  IDLE: "idle",
  ARMED: "short",
  EXHAUSTING: "warn",
  TRIGGERED: "long",
}

export function LiquidationMonitor({ liq }: { liq: LiquidationStats | undefined }) {
  return (
    <Panel
      title="Liquidation Cascade Monitor"
      right={<Badge tone={liq ? STATE_TONE[liq.state] : "idle"}>{liq?.state ?? "IDLE"}</Badge>}
      bodyClassName="p-2"
    >
      <div className="grid grid-cols-2 gap-1.5">
        <Metric label="Cascade Side" value={liq?.side ?? "--"} />
        <Metric label="Wick Extreme" value={fmtPrice(liq?.wickExtreme)} />
        <Metric label="Long Liqs (10s)" value={fmtCompactUsd(liq?.long10s)} valueClassName="text-short" />
        <Metric label="Short Liqs (10s)" value={fmtCompactUsd(liq?.short10s)} valueClassName="text-long" />
        <Metric label="Velocity" value={`${fmtCompactUsd(liq?.velocity)}/s`} />
        <Metric label="Peak Velocity" value={`${fmtCompactUsd(liq?.peakVelocity)}/s`} />
      </div>
      {liq?.action && (
        <div className="mt-2 rounded-sm bg-gold/10 px-2 py-1.5 text-[11px] font-bold text-gold">
          Trigger: {liq.action === "BUY_CAPITULATION" ? "BUY — capitulation exhausted" : "SELL — squeeze exhausted"}
        </div>
      )}
    </Panel>
  )
}
