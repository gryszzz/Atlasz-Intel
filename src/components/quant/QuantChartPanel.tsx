/*
 * QuantChartPanel — price + volume with event-overlay markers on the exact
 * bar timestamp. Imports recharts; consumers MUST lazy-load this component so
 * recharts stays out of the startup chunk (see code-splitting convention).
 *
 * Renders computed state only (bars + markers come from the Node quant
 * service). Shows DATA_UNAVAILABLE when history is insufficient.
 */
import { useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { QUANT_UNAVAILABLE, type EventOverlayMarker, type QuantSnapshot } from '../../quant'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#fb923c',
  elevated: '#facc15',
  moderate: '#5eead4',
  low: '#67e8f9',
}

export function QuantChartPanel({ snapshot }: { snapshot: QuantSnapshot }) {
  const [activeMarker, setActiveMarker] = useState<EventOverlayMarker | null>(null)

  if (!snapshot.dataAvailable || snapshot.bars.length === 0) {
    return (
      <div className="quant-chart-unavailable">
        <strong>{QUANT_UNAVAILABLE}</strong>
        <p>{snapshot.unavailableReason ?? 'Not available from current public sources.'}</p>
      </div>
    )
  }

  const data = snapshot.bars.map((bar) => ({ time: bar.time, price: bar.price, volume: bar.volume }))
  const prices = data.map((point) => point.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const markerY = (marker: EventOverlayMarker) => nearestPrice(snapshot, marker.timestamp)

  return (
    <div className="quant-chart-wrap">
      <div className="quant-chart-frame">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="quantPrice" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#5eead4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#5eead4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1c2825" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#6c7d76"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              minTickGap={48}
            />
            <YAxis yAxisId="price" stroke="#6c7d76" tickLine={false} axisLine={false} width={58} domain={[min, max]} />
            <YAxis yAxisId="volume" orientation="right" hide domain={[0, Math.max(...data.map((d) => d.volume)) * 4]} />
            <Tooltip
              contentStyle={{ background: '#0d1110', border: '1px solid #26322f', color: '#f2fff9' }}
              labelFormatter={(value) => new Date(Number(value)).toLocaleString()}
            />
            <Bar yAxisId="volume" dataKey="volume" fill="#243430" radius={[3, 3, 0, 0]} />
            <Area yAxisId="price" type="monotone" dataKey="price" stroke="#5eead4" strokeWidth={2.2} fill="url(#quantPrice)" />
            {snapshot.markers.map((marker) => (
              <ReferenceDot
                key={marker.eventId}
                yAxisId="price"
                x={marker.timestamp}
                y={markerY(marker)}
                r={5}
                fill={SEVERITY_COLOR[marker.severity] ?? '#67e8f9'}
                stroke="#050607"
                strokeWidth={1.5}
                onClick={() => setActiveMarker(marker)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="quant-marker-bar">
        <span className="quant-marker-count">{snapshot.markers.length} event markers</span>
        {activeMarker ? (
          <div className="quant-marker-detail">
            <strong>{activeMarker.title}</strong>
            <span>
              {new Date(activeMarker.timestamp).toLocaleString()} · {activeMarker.category} · link: {activeMarker.linkType}
            </span>
          </div>
        ) : (
          <span className="quant-marker-hint">Click a marker to inspect the linked event.</span>
        )}
      </div>
    </div>
  )
}

function nearestPrice(snapshot: QuantSnapshot, timestamp: number): number {
  let best = snapshot.bars[0]
  let bestDelta = Math.abs(best.time - timestamp)
  for (const bar of snapshot.bars) {
    const delta = Math.abs(bar.time - timestamp)
    if (delta < bestDelta) {
      best = bar
      bestDelta = delta
    }
  }
  return best.price
}
