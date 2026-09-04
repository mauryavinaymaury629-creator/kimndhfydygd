import { fmtPrice, fmtQty } from "@/lib/terminal/format"
import type { TapeTrade } from "@/lib/terminal/types"
import { Panel } from "./panel"

export function TradeTape({ trades }: { trades: TapeTrade[] }) {
  return (
    <Panel title="Aggregated Trade Tape" className="h-full" bodyClassName="overflow-y-auto scrollbar-thin">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 bg-card">
          <tr className="text-muted-foreground">
            <th className="px-2 py-1 text-left font-medium">Time</th>
            <th className="px-2 py-1 text-left font-medium">Side</th>
            <th className="px-2 py-1 text-right font-medium">Price</th>
            <th className="px-2 py-1 text-right font-medium">Size</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id}>
              <td className="tabular px-2 py-[3px] text-muted-foreground">
                {new Date(t.ts).toLocaleTimeString("en-US", { hour12: false })}
              </td>
              <td className={`px-2 py-[3px] font-bold ${t.side === "BUY" ? "text-long" : "text-short"}`}>{t.side}</td>
              <td className="tabular px-2 py-[3px] text-right">{fmtPrice(t.price)}</td>
              <td className="tabular px-2 py-[3px] text-right">{fmtQty(t.qty)}</td>
            </tr>
          ))}
          {trades.length === 0 && (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-center text-muted-foreground">
                Waiting for trades...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  )
}
