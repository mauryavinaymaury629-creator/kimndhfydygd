import { fmtPct, fmtPrice, fmtQty } from "@/lib/terminal/format"
import type { OrderBookLevel } from "@/lib/terminal/types"
import { Panel } from "./panel"

export function OrderBook({ bids, asks, imbalance }: { bids: OrderBookLevel[]; asks: OrderBookLevel[]; imbalance: number }) {
  const rows = Math.max(bids.length, asks.length, 10)
  const maxQty = Math.max(1, ...bids.map((b) => b[1]), ...asks.map((a) => a[1]))

  return (
    <Panel
      title="L2 Order Book"
      className="h-full"
      right={
        <span className={`tabular text-[11px] font-bold ${imbalance >= 0 ? "text-long" : "text-short"}`}>
          {fmtPct(imbalance, 1)}
        </span>
      }
      bodyClassName="overflow-y-auto scrollbar-thin"
    >
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 bg-card">
          <tr className="text-muted-foreground">
            <th className="px-2 py-1 text-left font-medium">Bid Size</th>
            <th className="px-2 py-1 text-right font-medium">Bid</th>
            <th className="px-2 py-1 text-left font-medium">Ask</th>
            <th className="px-2 py-1 text-right font-medium">Ask Size</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => {
            const bid = bids[i]
            const ask = asks[i]
            return (
              <tr key={i} className="relative">
                <td className="tabular relative px-2 py-[3px] text-left text-long">
                  <span
                    className="absolute inset-y-0 right-0 bg-long/10"
                    style={{ width: bid ? `${(bid[1] / maxQty) * 100}%` : 0 }}
                    aria-hidden
                  />
                  <span className="relative">{bid ? fmtQty(bid[1]) : ""}</span>
                </td>
                <td className="tabular px-2 py-[3px] text-right font-semibold text-long">
                  {bid ? fmtPrice(bid[0]) : ""}
                </td>
                <td className="tabular relative px-2 py-[3px] text-left font-semibold text-short">
                  <span
                    className="absolute inset-y-0 left-0 bg-short/10"
                    style={{ width: ask ? `${(ask[1] / maxQty) * 100}%` : 0 }}
                    aria-hidden
                  />
                  <span className="relative">{ask ? fmtPrice(ask[0]) : ""}</span>
                </td>
                <td className="tabular px-2 py-[3px] text-right text-short">{ask ? fmtQty(ask[1]) : ""}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}
