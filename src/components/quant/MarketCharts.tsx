/*
 * Recharts-backed quant charts. This module is the ONLY place recharts is
 * imported, and it is loaded lazily (React.lazy) so the recharts bundle stays
 * out of the app startup chunk — it loads only when a chart-bearing view opens.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const TOOLTIP_STYLE = { background: '#0d1110', border: '1px solid #26322f', color: '#f2fff9' } as const
const AXIS_STROKE = '#6c7d76'
const GRID_STROKE = '#1c2825'

export type MarketPoint = { time: string; price: number; volume: number }
export type VelocityPoint = { time: string; volume: number; velocity: number }

export function MarketPriceChart({ data }: { data: MarketPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 18, right: 18, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="marketGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#5eead4" stopOpacity={0.55} />
            <stop offset="95%" stopColor="#5eead4" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="time" stroke={AXIS_STROKE} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS_STROKE} tickLine={false} axisLine={false} width={58} domain={['dataMin', 'dataMax']} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="price" stroke="#5eead4" strokeWidth={2.5} fill="url(#marketGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MarketVolumeChart({ data }: { data: MarketPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="time" stroke={AXIS_STROKE} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS_STROKE} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="volume" fill="#facc15" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SocialVelocityChart({ data }: { data: VelocityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 6 }}>
        <defs>
          <linearGradient id="socialVelocityGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#67e8f9" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="time" stroke={AXIS_STROKE} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS_STROKE} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="volume" stroke="#67e8f9" strokeWidth={2.2} fill="url(#socialVelocityGradient)" />
        <Area type="monotone" dataKey="velocity" stroke="#facc15" strokeWidth={1.7} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
