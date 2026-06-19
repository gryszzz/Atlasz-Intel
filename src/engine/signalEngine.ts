import type {
  ConfidenceBand,
  LiveAssetSnapshot,
  LiveAttentionSnapshot,
  LiveDataFrame,
  LiveSignalEvent,
  SignalSeverity,
} from '../realtime'

type SignalCandidate = Omit<LiveSignalEvent, 'id' | 'createdAt' | 'evidenceIds' | 'confidence'> & {
  magnitude: number
}

export function detectRealtimeSignals(frame: LiveDataFrame, previousFrame: LiveDataFrame | null): LiveSignalEvent[] {
  const previousAttention = new Map(previousFrame?.attention.map((item) => [item.target, item]) ?? [])
  const attentionByTarget = new Map(frame.attention.map((item) => [item.target, item]))
  const averageChange =
    frame.assets.length > 0 ? frame.assets.reduce((total, asset) => total + asset.changePct, 0) / frame.assets.length : 0

  const candidates: SignalCandidate[] = []

  for (const asset of frame.assets) {
    const attention = attentionByTarget.get(asset.symbol)
    const previous = previousAttention.get(asset.symbol)
    candidates.push(...detectMarketSignals(asset, frame, averageChange))
    if (attention) {
      candidates.push(...detectAttentionSignals(asset, attention, previous, frame))
    }
  }

  return candidates
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 12)
    .map((candidate) => materializeSignal(candidate, frame))
}

function detectMarketSignals(asset: LiveAssetSnapshot, frame: LiveDataFrame, averageChange: number): SignalCandidate[] {
  const candidates: SignalCandidate[] = []
  const volumeBaseline = Math.max(asset.metrics.thirtyMinuteAverageVolume, 1)
  const volumeRatio = asset.metrics.oneMinuteVolume / volumeBaseline

  if (asset.metrics.volumeAcceleration >= 1.75 || volumeRatio >= 4) {
    candidates.push({
      type: 'unusual_volume_spike',
      assetOrTopicId: asset.symbol,
      severity: severityFromMagnitude(Math.max(asset.metrics.volumeAcceleration, volumeRatio / 2)),
      magnitude: Math.max(asset.metrics.volumeAcceleration, volumeRatio / 2),
      explanation: `${asset.symbol} volume is running ${volumeRatio.toFixed(1)}x its rolling baseline with acceleration ${asset.metrics.volumeAcceleration.toFixed(2)}.`,
      relatedGraphNodes: relatedNodesFor(asset.symbol, frame),
    })
  }

  if (asset.metrics.volatilityVelocity >= 18) {
    candidates.push({
      type: 'volatility_velocity_spike',
      assetOrTopicId: asset.symbol,
      severity: severityFromMagnitude(asset.metrics.volatilityVelocity / 10),
      magnitude: asset.metrics.volatilityVelocity / 10,
      explanation: `${asset.symbol} volatility velocity reached ${asset.metrics.volatilityVelocity.toFixed(1)} bps on the one-minute window.`,
      relatedGraphNodes: relatedNodesFor(asset.symbol, frame),
    })
  }

  const deviation = Math.abs(asset.changePct - averageChange)
  if (deviation >= 2.5 && asset.metrics.volatilityVelocity >= 8) {
    candidates.push({
      type: 'correlation_break',
      assetOrTopicId: asset.symbol,
      severity: severityFromMagnitude(deviation / 1.5),
      magnitude: deviation / 1.5,
      explanation: `${asset.symbol} is deviating ${deviation.toFixed(2)} points from the basket while volatility remains elevated.`,
      relatedGraphNodes: relatedNodesFor(asset.symbol, frame),
    })
  }

  return candidates
}

function detectAttentionSignals(
  asset: LiveAssetSnapshot,
  attention: LiveAttentionSnapshot,
  previous: LiveAttentionSnapshot | undefined,
  frame: LiveDataFrame,
): SignalCandidate[] {
  const candidates: SignalCandidate[] = []

  if (attention.pressure >= 78 || attention.mentionVelocity >= 8) {
    const magnitude = Math.max(attention.pressure / 25, attention.mentionVelocity / 3)
    candidates.push({
      type: 'attention_pressure_spike',
      assetOrTopicId: attention.target,
      severity: severityFromMagnitude(magnitude),
      magnitude,
      explanation: `${attention.target} attention pressure is ${attention.pressure.toFixed(0)} with dV/dt ${attention.mentionVelocity.toFixed(1)}.`,
      relatedGraphNodes: relatedNodesFor(attention.target, frame),
    })
  }

  const priceDirection = Math.sign(asset.changePct)
  const sentimentDirection = Math.sign(attention.sentimentDivergenceIndex)
  if (
    priceDirection !== 0 &&
    sentimentDirection !== 0 &&
    priceDirection !== sentimentDirection &&
    Math.abs(asset.changePct) >= 0.2 &&
    Math.abs(attention.sentimentDivergenceIndex) >= 0.28
  ) {
    const magnitude = Math.abs(asset.changePct) + Math.abs(attention.sentimentDivergenceIndex) * 3
    candidates.push({
      type: 'sentiment_price_divergence',
      assetOrTopicId: attention.target,
      severity: severityFromMagnitude(magnitude),
      magnitude,
      explanation: `${attention.target} price direction and social sentiment are diverging: price ${asset.changePct.toFixed(2)}%, sentiment index ${attention.sentimentDivergenceIndex.toFixed(2)}.`,
      relatedGraphNodes: relatedNodesFor(attention.target, frame),
    })
  }

  if (previous) {
    const acceleration = attention.mentionVelocity - previous.mentionVelocity
    if (acceleration >= 4.5 && attention.pressure >= 62) {
      const magnitude = acceleration / 2
      candidates.push({
        type: 'narrative_acceleration',
        assetOrTopicId: attention.target,
        severity: severityFromMagnitude(magnitude),
        magnitude,
        explanation: `${attention.target} narrative velocity accelerated by ${acceleration.toFixed(1)} mentions/min equivalent since the prior frame.`,
        relatedGraphNodes: relatedNodesFor(attention.target, frame),
      })
    }
  }

  return candidates
}

function materializeSignal(candidate: SignalCandidate, frame: LiveDataFrame): LiveSignalEvent {
  return {
    id: `${candidate.type}:${candidate.assetOrTopicId}:${Math.floor(frame.emittedAt / 1_000)}`,
    type: candidate.type,
    assetOrTopicId: candidate.assetOrTopicId,
    severity: candidate.severity,
    evidenceIds: [
      `frame:${frame.sequence}`,
      `asset:${candidate.assetOrTopicId}`,
      `signal:${candidate.type}`,
    ],
    confidence: confidenceFromSeverity(candidate.severity),
    createdAt: frame.emittedAt,
    explanation: candidate.explanation,
    relatedGraphNodes: candidate.relatedGraphNodes,
  }
}

function severityFromMagnitude(magnitude: number): SignalSeverity {
  if (magnitude >= 5) return 'critical'
  if (magnitude >= 3.5) return 'high'
  if (magnitude >= 2) return 'elevated'
  return 'watch'
}

function confidenceFromSeverity(severity: SignalSeverity): ConfidenceBand {
  if (severity === 'critical' || severity === 'high') return 'HIGH'
  if (severity === 'elevated') return 'ELEVATED'
  return 'WATCH'
}

function relatedNodesFor(symbol: string, frame: LiveDataFrame): string[] {
  const normalized = symbol.toLowerCase()
  const nodes = new Set<string>([symbol])
  for (const edge of frame.entityEdges) {
    if (edge.source.toLowerCase().includes(normalized) || edge.target.toLowerCase().includes(normalized)) {
      nodes.add(edge.source)
      nodes.add(edge.target)
    }
  }
  return [...nodes].slice(0, 8)
}
