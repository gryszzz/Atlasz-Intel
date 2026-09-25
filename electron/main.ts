import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPersistence } from './persistence'
import { RealtimeService } from './realtimeService'
import { WorldIntelService } from './worldIntelService'
import { QuantService } from './quant/quantService'
import { HistoricalPlaybookService } from './intel/historicalPlaybookService'
import { ThesisService } from './journal/thesisService'
import { DataIngestOrchestrator } from './ingest/dataIngestOrchestrator'
import { ProviderDiscoveryService } from './providers/providerDiscoveryService'
import type {
  DailyBriefRecord,
  DecisionRecord,
  IntelPersistence,
  WorldHeadlineRecord,
} from './persistence'
import type { ConnectorId } from '../src/realtime'
import type { ThesisDraft } from '../src/engine/decisionJournal'

const __dirname = dirname(fileURLToPath(import.meta.url))

let persistence: IntelPersistence | null = null
let realtime: RealtimeService | null = null
let worldIntel: WorldIntelService | null = null
let quant: QuantService | null = null
let playbook: HistoricalPlaybookService | null = null
let thesisJournal: ThesisService | null = null
let dataIngest: DataIngestOrchestrator | null = null
let providerDiscovery: ProviderDiscoveryService | null = null

function requirePersistence(): IntelPersistence {
  if (!persistence) {
    persistence = createPersistence(app.getPath('userData'))
  }
  return persistence
}

function requireRealtime(): RealtimeService {
  if (!realtime) {
    const store = requirePersistence()
    realtime = new RealtimeService({ persistence: store })
  }
  return realtime
}

function requireWorldIntel(): WorldIntelService {
  if (!worldIntel) {
    worldIntel = new WorldIntelService(requirePersistence())
  }
  return worldIntel
}

function requireQuant(): QuantService {
  if (!quant) {
    quant = new QuantService(requirePersistence())
  }
  return quant
}

function requirePlaybook(): HistoricalPlaybookService {
  if (!playbook) {
    playbook = new HistoricalPlaybookService(requirePersistence())
  }
  return playbook
}

function requireThesisJournal(): ThesisService {
  if (!thesisJournal) {
    thesisJournal = new ThesisService(requirePersistence())
  }
  return thesisJournal
}

function requireDataIngest(): DataIngestOrchestrator {
  if (!dataIngest) {
    dataIngest = new DataIngestOrchestrator({
      persistence: requirePersistence(),
      realtime: requireRealtime(),
    })
  }
  return dataIngest
}

function requireProviderDiscovery(): ProviderDiscoveryService {
  if (!providerDiscovery) {
    providerDiscovery = new ProviderDiscoveryService({
      userDataPath: app.getPath('userData'),
      persistence: requirePersistence(),
    })
  }
  return providerDiscovery
}

// Baseline Content-Security-Policy. There was previously none (external scripts
// loaded unrestricted). This allows the app's own bundle ('self') plus the
// official TradingView market-widget domains (third-party price reference) and
// blocks everything else. Connectors run in the main process, so the renderer
// does not need the data-source domains here.
// NOTE: only affects the packaged/desktop app, not the web preview. MUST pass the
// Mac GUI smoke test before release (per docs/release-readiness.md) — if a widget
// or asset fails to load, widen the matching directive.
function applyContentSecurityPolicy() {
  const tv = 'https://*.tradingview.com https://*.tradingview-widget.com'
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${tv}`,
    `style-src 'self' 'unsafe-inline' ${tv}`,
    `img-src 'self' data: blob: ${tv}`,
    `font-src 'self' data: ${tv}`,
    `connect-src 'self' ${tv} wss://*.tradingview.com`,
    `frame-src 'self' ${tv}`,
    "worker-src 'self' blob:",
  ].join('; ')
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [policy] },
    })
  })
}

function createWindow() {
  applyContentSecurityPolicy()
  const mainWindow = new BrowserWindow({
    title: 'Atlasz Intel',
    width: 1480,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#050607',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('atlasz:app-meta', () => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
  dataPath: app.getPath('userData'),
}))

ipcMain.handle('atlasz:open-external', async (_event, url: string) => {
  await shell.openExternal(url)
})

// --- Local persistence (SQLite WAL, JSON fallback) -------------------------

ipcMain.handle('atlasz:db:status', () => ({ mode: requirePersistence().mode }))

ipcMain.handle('atlasz:db:briefs:list', () => requirePersistence().listBriefs())
ipcMain.handle('atlasz:db:briefs:save', (_event, record: DailyBriefRecord) => {
  requirePersistence().saveBrief(record)
  return { ok: true }
})

ipcMain.handle('atlasz:db:headlines:list', (_event, limit?: number) =>
  requirePersistence().listHeadlines(limit),
)
ipcMain.handle('atlasz:db:headlines:save', (_event, record: WorldHeadlineRecord) => {
  requirePersistence().saveHeadline(record)
  return { ok: true }
})

ipcMain.handle('atlasz:db:decisions:list', () => requirePersistence().listDecisions())
ipcMain.handle('atlasz:db:decisions:get', (_event, id: string) => requirePersistence().getDecision(id))
ipcMain.handle('atlasz:db:decisions:save', (_event, record: DecisionRecord) => {
  requirePersistence().saveDecision(record)
  return { ok: true }
})
ipcMain.handle('atlasz:db:decisions:delete', (_event, id: string) => {
  requirePersistence().deleteDecision(id)
  return { ok: true }
})
ipcMain.handle('atlasz:db:decisions:due', (_event, now: number) =>
  requirePersistence().decisionsDueForReview(now),
)

// --- Local realtime data core ---------------------------------------------

ipcMain.handle('atlasz:realtime:start', () => requireRealtime().start())
ipcMain.handle('atlasz:realtime:stop', () => requireRealtime().stop())
ipcMain.handle('atlasz:realtime:restart', (_event, connectorId?: string) =>
  requireRealtime().restart(connectorId as ConnectorId | undefined),
)
ipcMain.handle('atlasz:realtime:add-asset', (_event, query: string) => requireRealtime().addAsset(query))
ipcMain.handle('atlasz:realtime:snapshot', () => requireRealtime().snapshot())
ipcMain.handle('atlasz:realtime:status', () => requireRealtime().status())
ipcMain.handle('atlasz:realtime:health', () => requireRealtime().health())
ipcMain.handle('atlasz:realtime:traverse-risk', (_event, nodeId: string) =>
  requireRealtime().traverseRisk(nodeId),
)
ipcMain.handle('atlasz:realtime:replay:start', (_event, options?: { from?: number; to?: number; speed?: 1 | 2 | 5 }) =>
  requireRealtime().replayStart(options),
)
ipcMain.handle('atlasz:realtime:replay:pause', () => requireRealtime().replayPause())
ipcMain.handle('atlasz:realtime:replay:resume', () => requireRealtime().replayResume())
ipcMain.handle('atlasz:realtime:replay:stop', () => requireRealtime().replayStop())
ipcMain.handle('atlasz:realtime:replay:speed', (_event, speed: 1 | 2 | 5) =>
  requireRealtime().replaySetSpeed(speed),
)
ipcMain.handle('atlasz:realtime:replay:seek', (_event, cursor: number) =>
  requireRealtime().replaySeek(cursor),
)

// --- Public world/event intelligence --------------------------------------

ipcMain.handle('atlasz:world:snapshot', () => requireWorldIntel().snapshot())
ipcMain.handle('atlasz:world:refresh', () => requireWorldIntel().refresh())
ipcMain.handle('atlasz:world:pause-refresh', () => requireWorldIntel().pauseAutoRefresh())
ipcMain.handle('atlasz:world:resume-refresh', () => requireWorldIntel().resumeAutoRefresh())
ipcMain.handle('atlasz:world:favorite', (_event, kind: 'asset' | 'country' | 'event' | 'narrative', targetId: string, label: string) =>
  requireWorldIntel().toggleFavorite(kind, targetId, label),
)
ipcMain.handle('atlasz:quant:snapshot', () => requireQuant().snapshot())

ipcMain.handle('atlasz:intel:playbook', (_event, eventId: string) => requirePlaybook().playbookFor(eventId))

ipcMain.handle('atlasz:thesis:save', (_event, draft: ThesisDraft) => requireThesisJournal().save(draft))
ipcMain.handle('atlasz:thesis:dashboard', () => requireThesisJournal().dashboard())

ipcMain.handle('atlasz:ingest:status', () => requireDataIngest().status())

ipcMain.handle('atlasz:providers:snapshot', () => requireProviderDiscovery().snapshot())
ipcMain.handle('atlasz:providers:discover', () => requireProviderDiscovery().discover())
ipcMain.handle('atlasz:providers:open-config', () => {
  const result = requireProviderDiscovery().ensureConfigTemplate()
  shell.showItemInFolder(result.path)
  return result
})

app.whenReady().then(() => {
  requirePersistence()
  // Start the real public market worker at launch so market_ticks_daily fuel
  // flows regardless of the renderer's persisted pulse toggle. Fail-soft: a
  // worker init error must not block app startup.
  try {
    requireRealtime().start()
  } catch (error) {
    console.error('[atlasz] realtime start failed at launch:', error)
  }
  requireWorldIntel().startAutoRefresh()
  void requireProviderDiscovery().discover()
  requireDataIngest().start()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  dataIngest?.stop()
  dataIngest = null
  realtime?.close()
  realtime = null
  worldIntel?.stopAutoRefresh()
  worldIntel = null
  providerDiscovery = null
  persistence?.close()
  persistence = null
})
