"use client"

import { useEffect, useRef } from "react"
import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  LineStyle,
} from "lightweight-charts"
import type { KlineBar, ScalpSignal } from "@/lib/terminal/types"

interface PriceChartProps {
  klines: KlineBar[]
  signal: ScalpSignal | null
}

export function PriceChart({ klines, signal }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const linesRef = useRef<IPriceLine[]>([])
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: true, secondsVisible: false },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#3ecf8e",
      downColor: "#e5484d",
      borderUpColor: "#3ecf8e",
      borderDownColor: "#e5484d",
      wickUpColor: "#3ecf8e",
      wickDownColor: "#e5484d",
    })

    chartRef.current = chart
    seriesRef.current = series

    const resize = () => {
      if (!containerRef.current) return
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || klines.length === 0) return
    const data = klines.map((k) => ({ time: k.time as any, open: k.open, high: k.high, low: k.low, close: k.close }))
    if (lastTimeRef.current === 0) {
      seriesRef.current.setData(data)
    } else {
      const last = data[data.length - 1]
      if (last.time >= lastTimeRef.current) seriesRef.current.update(last)
    }
    lastTimeRef.current = data[data.length - 1].time as number
  }, [klines])

  // Draw ideal entry / stop / target price lines for the active signal.
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return
    for (const line of linesRef.current) series.removePriceLine(line)
    linesRef.current = []

    if (!signal || signal.side === null) return

    const longColor = "#3ecf8e"
    const shortColor = "#e5484d"
    const dirColor = signal.side === "LONG" ? longColor : shortColor

    linesRef.current.push(
      series.createPriceLine({
        price: signal.idealEntry,
        color: "#f5c542",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "IDEAL ENTRY",
      }),
    )
    linesRef.current.push(
      series.createPriceLine({
        price: signal.stopLoss,
        color: shortColor,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "SL",
      }),
    )
    signal.targets.forEach((t) => {
      linesRef.current.push(
        series!.createPriceLine({
          price: t.price,
          color: longColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: t.label,
        }),
      )
    })
    linesRef.current.push(
      series.createPriceLine({
        price: signal.swingLow,
        color: "rgba(255,255,255,0.35)",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: false,
        title: "Swing Low",
      }),
    )
    linesRef.current.push(
      series.createPriceLine({
        price: signal.swingHigh,
        color: "rgba(255,255,255,0.35)",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: false,
        title: "Swing High",
      }),
    )
    void dirColor
  }, [signal])

  return <div ref={containerRef} className="h-full w-full min-h-0" />
}
