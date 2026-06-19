import electron from 'electron'
import type { DailyBriefRecord, DecisionRecord, WorldHeadlineRecord } from './persistence'

const { contextBridge, ipcRenderer } = electron

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
})
