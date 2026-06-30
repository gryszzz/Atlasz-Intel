/*
 * TradingView embeddable widget wrapper.
 *
 * Real market price data via TradingView's OFFICIAL free embed widgets (no API
 * key). This is a THIRD-PARTY market reference — it loads a script from
 * tradingview.com and is never presented as an Atlasz source-backed proof. Label
 * it accordingly in the UI. Prices/charts only; Atlasz adds no buy/sell signal.
 *
 * Note: in the packaged desktop app the CSP must allow s3.tradingview.com /
 * *.tradingview.com (script-src, frame-src, connect-src) for these to load.
 */
import { useEffect, useRef } from 'react'

export type TradingViewWidgetProps = {
  /** Official embed script, e.g. embed-widget-ticker-tape.js */
  scriptSrc: string
  /** Widget JSON config (symbols, theme, etc.). */
  config: Record<string, unknown>
  height?: number | string
  className?: string
}

export function TradingViewWidget({ scriptSrc, config, height, className }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const configKey = JSON.stringify(config)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Reset (handles re-mounts / config changes / StrictMode double-invoke).
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>'
    const script = document.createElement('script')
    script.src = scriptSrc
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = configKey
    container.appendChild(script)
    return () => {
      container.innerHTML = ''
    }
  }, [scriptSrc, configKey])

  return (
    <div
      className={`tradingview-widget-container${className ? ` ${className}` : ''}`}
      ref={containerRef}
      style={{ height: height ?? '100%', width: '100%' }}
    />
  )
}
