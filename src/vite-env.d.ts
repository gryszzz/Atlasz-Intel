/// <reference types="vite/client" />

import type { ConnectorId, LiveEngineSnapshot, LiveEngineStatus, RealtimeHealth, ReplayState } from './realtime'

declare global {
  type AtlaszDesktopMeta = {
    name: string
    version: string
    platform: string
    dataPath: string
  }

  type AtlaszDesktopBridge = {
    getAppMeta: () => Promise<AtlaszDesktopMeta>
    openExternal: (url: string) => Promise<void>
    realtime?: {
      start: () => Promise<LiveEngineSnapshot>
      stop: () => Promise<LiveEngineSnapshot>
      restart: (connectorId?: ConnectorId) => Promise<LiveEngineSnapshot>
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
  }

  interface Window {
    atlaszDesktop?: AtlaszDesktopBridge
  }
}

export {}
