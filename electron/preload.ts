import electron from 'electron'

const { contextBridge, ipcRenderer } = electron

contextBridge.exposeInMainWorld('atlaszDesktop', {
  getAppMeta: () => ipcRenderer.invoke('atlasz:app-meta'),
  openExternal: (url: string) => ipcRenderer.invoke('atlasz:open-external', url),
})
