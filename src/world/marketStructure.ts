export type MarketRegime =
  | 'expansion'
  | 'contraction'
  | 'high-volatility'
  | 'low-volatility'
  | 'transition'
  | 'unknown'

export type TrendState =
  | 'advancing'
  | 'declining'
  | 'range'
  | 'transition'
  | 'unknown'

export type LiquidityState =
  | 'improving'
  | 'tightening'
  | 'stable'
  | 'fragmented'
  | 'unknown'

export type PositioningState =
  | 'crowded-long'
  | 'crowded-short'
  | 'balanced'
  | 'changing'
  | 'unknown'

export type FlowState =
  | 'inflow'
  | 'outflow'
  | 'rotation'
  | 'mixed'
  | 'unknown'

export interface MarketStructureInput {
  entityId: string
  observedAt: string
  priceReturn?: number
  priceVsTrend?: number
  realizedVolatilityZ?: number
  impliedVolatilityZ?: number
  volumeZ?: number
  breadthZ?: number
  liquidityZ?: number
  optionsSkewZ?: number
  openInterestZ?: number
  fundFlowZ?: number
  exchangeFlowZ?: number
  eventRiskScore?: number
  confidence: number
}

export interface MarketStructureLens {
  entityId: string
  observedAt: string
  regime: MarketRegime
  trend: TrendState
  liquidity: LiquidityState
  positioning: PositioningState
  flow: FlowState
  confidence: number
  observations: string[]
  tensions: string[]
  invalidationQuestions: string[]
  unavailable: string[]
}

function present(value: number | undefined): value is number {
  return Number.isFinite(value)
}

/**
 * Deterministic market-structure interpretation.
 *
 * This is descriptive context, not a trade recommendation. Missing inputs remain
 * unavailable and no absent field is inferred.
 */
export function describeMarketStructure(
  input: MarketStructureInput,
): MarketStructureLens {
  const observations: string[] = []
  const tensions: string[] = []
  const invalidationQuestions: string[] = []
  const unavailable: string[] = []

  let trend: TrendState = 'unknown'
  if (present(input.priceVsTrend) && present(input.priceReturn)) {
    if (input.priceVsTrend > 0.5 && input.priceReturn > 0) trend = 'advancing'
    else if (input.priceVsTrend < -0.5 && input.priceReturn < 0) trend = 'declining'
    else if (Math.abs(input.priceVsTrend) < 0.4) trend = 'range'
    else trend = 'transition'
    observations.push(`Price/trend structure: ${trend}`)
  } else {
    unavailable.push('trend context')
  }

  let liquidity: LiquidityState = 'unknown'
  if (present(input.liquidityZ)) {
    if (input.liquidityZ > 0.75) liquidity = 'improving'
    else if (input.liquidityZ < -0.75) liquidity = 'tightening'
    else liquidity = 'stable'
    observations.push(`Liquidity: ${liquidity}`)
  } else {
    unavailable.push('liquidity context')
  }

  const volatilityZ = present(input.impliedVolatilityZ)
    ? input.impliedVolatilityZ
    : input.realizedVolatilityZ

  let regime: MarketRegime = 'unknown'
  if (present(volatilityZ)) {
    if (volatilityZ > 1.25) regime = 'high-volatility'
    else if (volatilityZ < -0.75) regime = 'low-volatility'
    else if (trend === 'advancing') regime = 'expansion'
    else if (trend === 'declining') regime = 'contraction'
    else regime = 'transition'
    observations.push(`Volatility regime: ${regime}`)
  } else {
    unavailable.push('volatility regime')
  }

  let positioning: PositioningState = 'unknown'
  if (present(input.optionsSkewZ) || present(input.openInterestZ)) {
    const skew = input.optionsSkewZ ?? 0
    const oi = input.openInterestZ ?? 0
    if (skew > 1 && oi > 0.75) positioning = 'crowded-short'
    else if (skew < -1 && oi > 0.75) positioning = 'crowded-long'
    else if (Math.abs(skew) < 0.5 && Math.abs(oi) < 1) positioning = 'balanced'
    else positioning = 'changing'
    observations.push(`Positioning: ${positioning}`)
  } else {
    unavailable.push('positioning')
  }

  let flow: FlowState = 'unknown'
  const flowValues = [input.fundFlowZ, input.exchangeFlowZ].filter(present)
  if (flowValues.length > 0) {
    const mean = flowValues.reduce((sum, value) => sum + value, 0) / flowValues.length
    if (mean > 0.8) flow = 'inflow'
    else if (mean < -0.8) flow = 'outflow'
    else if (flowValues.some((value) => Math.sign(value) !== Math.sign(mean))) flow = 'mixed'
    else flow = 'rotation'
    observations.push(`Observed flow context: ${flow}`)
  } else {
    unavailable.push('flow context')
  }

  if (trend === 'advancing' && liquidity === 'tightening') {
    tensions.push('Price trend is advancing while liquidity is tightening.')
  }
  if (trend === 'declining' && liquidity === 'improving') {
    tensions.push('Price trend is declining while liquidity is improving.')
  }
  if (regime === 'high-volatility' && positioning !== 'balanced' && positioning !== 'unknown') {
    tensions.push('High volatility is coinciding with directional positioning.')
  }
  if (present(input.eventRiskScore) && input.eventRiskScore > 0.7) {
    tensions.push('Material event risk is elevated relative to the current structure.')
  }

  invalidationQuestions.push(
    'Does price stop behaving consistently with the current trend state?',
    'Does liquidity reverse direction?',
    'Does positioning unwind or become more crowded?',
    'Do observed flows confirm or contradict the current structure?',
    'Has new world-state evidence changed the exposure map?',
  )

  return {
    entityId: input.entityId,
    observedAt: input.observedAt,
    regime,
    trend,
    liquidity,
    positioning,
    flow,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    observations,
    tensions,
    invalidationQuestions,
    unavailable,
  }
}
