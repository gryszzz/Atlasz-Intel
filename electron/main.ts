import electron from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { app, BrowserWindow, ipcMain, shell } = electron
const __dirname = dirname(fileURLToPath(import.meta.url))

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

app.whenReady().then(() => {
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
