// XAU/USDT perpetual futures scalp terminal — global config
export const SYMBOL_DISPLAY = "XAU/USDT"
export const INTERVAL = "15m"
export const INTERVAL_SECONDS = 15 * 60

// Risk & strategy constraints (simulated account)
export const EQUITY_USD = 10_000
export const RISK_PER_TRADE_PCT = 0.01
export const MAX_LEVERAGE = 10

// Liquidation cascade detection (calibrated for XAU notional sizes, not BTC-scale)
export const CASCADE_THRESHOLD_USD = 50_000 // liquidation notional in a 10s window to arm
export const VELOCITY_THRESHOLD_USD_S = 5_000 // $/s burst to arm

// Display precision
export const PRICE_DECIMALS = 2
export const QTY_DECIMALS = 3

// Polling cadence (ms) — client -> /api/market
export const POLL_INTERVAL_MS = 1500

// Scalp engine tuning
export const SWING_LOOKBACK = 8
export const RSI_OVERBOUGHT = 65
export const RSI_OVERSOLD = 35
export const RSI_EXTREME_OVERBOUGHT = 72
export const RSI_EXTREME_OVERSOLD = 28
export const EXTENDED_ATR_MULT = 1.5 // price further than this many ATRs from ideal entry = "extended"
