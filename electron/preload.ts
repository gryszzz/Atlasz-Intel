import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { DailyBriefRecord, DecisionRecord, WorldHeadlineRecord } from './persistence'
import type { ConnectorId, LiveEngineSnapshot, ReplayState } from '../src/realtime'
import type { WorldIntelSnapshot } from '../src/worldIntel'
import type { QuantTerminalSnapshot } from '../src/quant'
import type { HistoricalPlaybook } from '../src/intel'
import type { ThesisDashboard, ThesisDraft } from '../src/engine/decisionJournal'
import type { ProviderDiscoverySnapshot } from '../src/providerDiscovery'

contextBridge.exposeInMainWorld('atlaszDesktop', {
  getAppMeta: () => ipcRenderer.invoke('atlasz:app-meta'),
  openExternal: (url: string) => ipcRenderer.invoke('atlasz:open-external', url),
  db: {
    status: () => ipcRenderer.invoke('atlasz:db:status'),
    listBriefs: () => ipcRenderer.invoke('atlasz:db:briefs:list'),
    saveBrief: (record: DailyBriefRecord) => ipcRenderer.invoke('atlasz:db:briefs:save', record),
    listHeadlines: (limit?: number) => ipcRenderer.invoke('atlasz:db:headlines:list', limit),
    saveHeadline: (record: WorldHeadlineRecord) => ipcRenderer.invoke('atlasz:db:headlines:save', record),
    listDecisions: () => ipcRenderer.invoke('atlasz:db:decisions:list'),
    getDecision: (id: string) => ipcRenderer.invoke('atlasz:db:decisions:get', id),
    saveDecision: (record: DecisionRecord) => ipcRenderer.invoke('atlasz:db:decisions:save', record),
    deleteDecision: (id: string) => ipcRenderer.invoke('atlasz:db:decisions:delete', id),
    decisionsDueForReview: (now: number) => ipcRenderer.invoke('atlasz:db:decisions:due', now),
  },
  realtime: {
    start: () => ipcRenderer.invoke('atlasz:realtime:start'),
    stop: () => ipcRenderer.invoke('atlasz:realtime:stop'),
    restart: (connectorId?: ConnectorId) => ipcRenderer.invoke('atlasz:realtime:restart', connectorId),
    addAsset: (query: string) => ipcRenderer.invoke('atlasz:realtime:add-asset', query),
    snapshot: () => ipcRenderer.invoke('atlasz:realtime:snapshot'),
    status: () => ipcRenderer.invoke('atlasz:realtime:status'),
    health: () => ipcRenderer.invoke('atlasz:realtime:health'),
    traverseRisk: (nodeId: string) => ipcRenderer.invoke('atlasz:realtime:traverse-risk', nodeId),
    replayStart: (options?: { from?: number; to?: number; speed?: ReplayState['speed'] }) =>
      ipcRenderer.invoke('atlasz:realtime:replay:start', options),
    replayPause: () => ipcRenderer.invoke('atlasz:realtime:replay:pause'),
    replayResume: () => ipcRenderer.invoke('atlasz:realtime:replay:resume'),
    replayStop: () => ipcRenderer.invoke('atlasz:realtime:replay:stop'),
    replaySetSpeed: (speed: ReplayState['speed']) => ipcRenderer.invoke('atlasz:realtime:replay:speed', speed),
    replaySeek: (cursor: number) => ipcRenderer.invoke('atlasz:realtime:replay:seek', cursor),
    onFrame: (listener: (snapshot: LiveEngineSnapshot) => void) => {
      const wrapped = (_event: IpcRendererEvent, snapshot: LiveEngineSnapshot) => listener(snapshot)
      ipcRenderer.on('atlasz:realtime:frame', wrapped)
      return () => ipcRenderer.off('atlasz:realtime:frame', wrapped)
    },
  },
  world: {
    snapshot: (): Promise<WorldIntelSnapshot> => ipcRenderer.invoke('atlasz:world:snapshot'),
    refresh: (): Promise<WorldIntelSnapshot> => ipcRenderer.invoke('atlasz:world:refresh'),
    favorite: (kind: 'asset' | 'country' | 'event' | 'narrative', targetId: string, label: string): Promise<WorldIntelSnapshot> =>
      ipcRenderer.invoke('atlasz:world:favorite', kind, targetId, label),
  },
  quant: {
    snapshot: (): Promise<QuantTerminalSnapshot> => ipcRenderer.invoke('atlasz:quant:snapshot'),
  },
  intel: {
    playbook: (eventId: string): Promise<HistoricalPlaybook> => ipcRenderer.invoke('atlasz:intel:playbook', eventId),
  },
  thesis: {
    save: (draft: ThesisDraft): Promise<ThesisDashboard> => ipcRenderer.invoke('atlasz:thesis:save', draft),
    dashboard: (): Promise<ThesisDashboard> => ipcRenderer.invoke('atlasz:thesis:dashboard'),
  },
  ingest: {
    status: () => ipcRenderer.invoke('atlasz:ingest:status'),
  },
  providers: {
    snapshot: (): Promise<ProviderDiscoverySnapshot> => ipcRenderer.invoke('atlasz:providers:snapshot'),
    discover: (): Promise<ProviderDiscoverySnapshot> => ipcRenderer.invoke('atlasz:providers:discover'),
    openConfig: (): Promise<{ path: string; created: boolean }> => ipcRenderer.invoke('atlasz:providers:open-config'),
  },
})
