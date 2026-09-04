import { fmtPct, fmtPrice, fmtSigned } from "@/lib/terminal/format"
import type { ScalpSignal } from "@/lib/terminal/types"
import { Badge, Panel } from "./panel"

export function ScalpSignalPanel({ signal, className }: { signal: ScalpSignal | undefined; className?: string }) {
  const tone = signal?.signal === "LONG" ? "long" : signal?.signal === "SHORT" ? "short" : "neutral"
  const sideLabel = signal?.side ?? "--"

  return (
    <Panel
      title="15m Scalp Signal Engine"
      className={className}
      right={
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground">{sideLabel}</span>
          <Badge tone={tone as any}>{signal?.signal ?? "WAIT"}</Badge>
        </div>
      }
      bodyClassName="flex flex-col gap-2 p-2.5 overflow-y-auto scrollbar-thin"
    >
      {/* Three ideal entry zones — always computed, even on WAIT */}
      <div>
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ideal Entry Zones {signal?.side === "SHORT" ? "(highest = ideal)" : "(lowest = ideal)"}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(signal?.entryZones ?? []).map((z) => {
            const isIdeal = signal && Math.abs(z.price - signal.idealEntry) < 0.005
            return (
              <div
                key={z.key}
                className={`rounded-sm px-2 py-1.5 text-center ${
                  isIdeal ? "bg-gold/15 ring-1 ring-gold/50" : "bg-white/[0.03]"
                }`}
              >
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{z.label}</div>
                <div className={`tabular text-[13px] font-bold ${isIdeal ? "text-gold" : "text-foreground"}`}>
                  {fmtPrice(z.price)}
                </div>
                <div className="tabular text-[9px] text-muted-foreground">{fmtPct(z.distancePct)}</div>
              </div>
            )
          })}
          {(!signal || signal.entryZones.length === 0) &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-sm bg-white/[0.03] px-2 py-1.5 text-center">
                <div className="text-[13px] font-bold text-muted-foreground">--</div>
              </div>
            ))}
        </div>
      </div>

      {/* Ideal entry + stop + swing levels */}
      <div className="grid grid-cols-4 gap-1.5">
        <MiniStat label="Ideal Entry" value={fmtPrice(signal?.idealEntry)} valueClassName="text-gold" />
        <MiniStat label="Stop Loss" value={fmtPrice(signal?.stopLoss)} valueClassName="text-short" />
        <MiniStat label="Swing Low" value={fmtPrice(signal?.swingLow)} />
        <MiniStat label="Swing High" value={fmtPrice(signal?.swingHigh)} />
      </div>

      {/* Dual targets with separate R:R */}
      <div className="grid grid-cols-2 gap-1.5">
        {(signal?.targets ?? [{ label: "TP1", price: 0, rr: 0 }, { label: "TP2", price: 0, rr: 0 }]).map((t) => (
          <div key={t.label} className="rounded-sm bg-long/10 px-2 py-1.5 text-center">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
            <div className="tabular text-[13px] font-bold text-long">{fmtPrice(t.price)}</div>
            <div className="tabular text-[9px] text-muted-foreground">R:R {t.rr ? t.rr.toFixed(2) : "--"}</div>
          </div>
        ))}
      </div>

      {/* Real-time distance to EMA9 / VWAP */}
      <div className="grid grid-cols-2 gap-1.5">
        <MiniStat
          label="Dist to EMA9"
          value={`${fmtSigned(signal?.distanceToEma9)} (${fmtPct(signal?.distanceToEma9Pct)})`}
        />
        <MiniStat
          label="Dist to VWAP"
          value={`${fmtSigned(signal?.distanceToVwap)} (${fmtPct(signal?.distanceToVwapPct)})`}
        />
      </div>

      {/* Extended price limit-order hint */}
      {signal?.extended && signal.limitOrderHint && (
        <div className="rounded-sm border border-warn/30 bg-warn/10 px-2 py-1.5 text-[11px] font-medium text-warn">
          {signal.limitOrderHint}
        </div>
      )}

      <p className="text-[11px] leading-snug text-muted-foreground">{signal?.reason ?? "--"}</p>
    </Panel>
  )
}

function MiniStat({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-sm bg-white/[0.03] px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`tabular text-[12px] font-bold text-foreground ${valueClassName ?? ""}`}>{value}</div>
    </div>
  )
}
