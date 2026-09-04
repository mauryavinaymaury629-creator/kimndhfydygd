import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Panel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("flex flex-col rounded-md border border-border bg-card", className)}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gold">{title}</h2>
        {right}
      </header>
      <div className={cn("min-h-0 flex-1 overflow-auto", bodyClassName)}>{children}</div>
    </section>
  )
}

export function Metric({ label, value, valueClassName }: { label: string; value: ReactNode; valueClassName?: string }) {
  return (
    <div className="rounded-sm bg-white/[0.03] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("tabular text-[13px] font-semibold text-foreground", valueClassName)}>{value}</div>
    </div>
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "long" | "short" | "neutral" | "warn" | "idle" }) {
  const toneClasses: Record<string, string> = {
    long: "bg-long text-long-foreground",
    short: "bg-short text-short-foreground",
    neutral: "bg-secondary text-secondary-foreground",
    warn: "bg-warn text-black",
    idle: "bg-white/10 text-muted-foreground",
  }
  return (
    <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", toneClasses[tone])}>
      {children}
    </span>
  )
}
