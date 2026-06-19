import electron from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPersistence } from './persistence'
import { RealtimeService } from './realtimeService'
import type {
  DailyBriefRecord,
  DecisionRecord,
  IntelPersistence,
  WorldHeadlineRecord,
} from './persistence'
import type { ConnectorId } from '../src/realtime'

const { app, BrowserWindow, ipcMain, shell } = electron
const __dirname = dirname(fileURLToPath(import.meta.url))

let persistence: IntelPersistence | null = null
let realtime: RealtimeService | null = null

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

function createWindow() {
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
      preload: join(__dirname, 'preload.mjs'),
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

app.whenReady().then(() => {
  requirePersistence()
  requireRealtime()
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
  realtime?.close()
  realtime = null
  persistence?.close()
  persistence = null
})
