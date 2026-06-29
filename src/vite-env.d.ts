/// <reference types="vite/client" />

import type { ConnectorId, LiveEngineSnapshot, LiveEngineStatus, RealtimeHealth, ReplayState } from './realtime'
import type { WorldIntelSnapshot } from './worldIntel'
import type { QuantTerminalSnapshot } from './quant'
import type { HistoricalPlaybook } from './intel'
import type { ThesisDashboard, ThesisDraft } from './engine/decisionJournal'
import type { ProviderDiscoverySnapshot } from './providerDiscovery'

declare global {
  type AtlaszDesktopMeta = {
    name: string
    version: string
    platform: string
    dataPath: string
  }

  type AtlaszPublicIngestStatus = {
    running: boolean
    enabled: boolean
    startedAt?: number
    lastNewsAt?: number
    lastMarketPollAt?: number
    lastSocialPollAt?: number
    lastProbabilityPollAt?: number
    rssHeadlineCount: number
    stocktwitsBatchCount: number
    yahooTickCount: number
    probabilityCount: number
    exposureEdgeCount: number
    narrativeVelocityPerMinute: number
    cognitiveMode: 'deep' | 'keyword-priority' | 'batch-summary' | 'disabled'
    cognitiveQueueLength: number
    cognitiveAverageLatencyMs?: number
    cognitiveTimeoutMs?: number
    cognitiveValidationFailures: number
    cognitiveSkippedCount: number
    cognitiveBatchedCount: number
    cognitiveSourcePenaltyCount: number
    lastError?: string
  }

  type AtlaszDesktopBridge = {
    getAppMeta: () => Promise<AtlaszDesktopMeta>
    openExternal: (url: string) => Promise<void>
    realtime?: {
      start: () => Promise<LiveEngineSnapshot>
      stop: () => Promise<LiveEngineSnapshot>
      restart: (connectorId?: ConnectorId) => Promise<LiveEngineSnapshot>
      addAsset: (query: string) => Promise<LiveEngineSnapshot>
      snapshot: () => Promise<LiveEngineSnapshot>
      status: () => Promise<LiveEngineStatus>
      health: () => Promise<RealtimeHealth>
      traverseRisk: (nodeId: string) => Promise<unknown[]>
      replayStart: (options?: { from?: number; to?: number; speed?: ReplayState['speed'] }) => Promise<LiveEngineSnapshot>
      replayPause: () => Promise<LiveEngineSnapshot>
      replayResume: () => Promise<LiveEngineSnapshot>
      replayStop: () => Promise<LiveEngineSnapshot>
      replaySetSpeed: (speed: ReplayState['speed']) => Promise<LiveEngineSnapshot>
      replaySeek: (cursor: number) => Promise<LiveEngineSnapshot>
      onFrame: (listener: (snapshot: LiveEngineSnapshot) => void) => () => void
    }
    world?: {
      snapshot: () => Promise<WorldIntelSnapshot>
      refresh: () => Promise<WorldIntelSnapshot>
      pauseRefresh: () => Promise<WorldIntelSnapshot>
      resumeRefresh: () => Promise<WorldIntelSnapshot>
      favorite: (
        kind: 'asset' | 'country' | 'event' | 'narrative',
        targetId: string,
        label: string,
      ) => Promise<WorldIntelSnapshot>
    }
    quant?: {
      snapshot: () => Promise<QuantTerminalSnapshot>
    }
    intel?: {
      playbook: (eventId: string) => Promise<HistoricalPlaybook>
    }
    thesis?: {
      save: (draft: ThesisDraft) => Promise<ThesisDashboard>
      dashboard: () => Promise<ThesisDashboard>
    }
    ingest?: {
      status: () => Promise<AtlaszPublicIngestStatus>
    }
    providers?: {
      snapshot: () => Promise<ProviderDiscoverySnapshot>
      discover: () => Promise<ProviderDiscoverySnapshot>
      openConfig: () => Promise<{ path: string; created: boolean }>
    }
  }

  interface Window {
    atlaszDesktop?: AtlaszDesktopBridge
  }
}

export {}
