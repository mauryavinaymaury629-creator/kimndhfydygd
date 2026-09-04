export function fmtPrice(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--"
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

export function fmtSigned(value: number | undefined | null, decimals = 2, suffix = ""): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(decimals)}${suffix}`
}

export function fmtQty(value: number | undefined | null, decimals = 3): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--"
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtPct(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(decimals)}%`
}

export function fmtCompactUsd(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--"
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}
