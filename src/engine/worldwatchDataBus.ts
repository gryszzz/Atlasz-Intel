import type { WorldwatchLayerId, WorldwatchLayerSnapshot, WorldwatchSelectionDossier } from './worldwatchLayerRegistry'

export type WorldwatchBusEvents = {
  snapshot: WorldwatchLayerSnapshot
  select: WorldwatchSelectionDossier | null
  'toggle-layer': { layerId: WorldwatchLayerId; active: boolean }
  'focus-layer': { layerId: WorldwatchLayerId }
}

export type WorldwatchBusEventName = keyof WorldwatchBusEvents
export type WorldwatchBusHandler<K extends WorldwatchBusEventName> = (payload: WorldwatchBusEvents[K]) => void

export class WorldwatchDataBus {
  private readonly listeners = new Map<WorldwatchBusEventName, Set<(payload: unknown) => void>>()

  on<K extends WorldwatchBusEventName>(eventName: K, handler: WorldwatchBusHandler<K>): () => void {
    const handlers = this.listeners.get(eventName) ?? new Set()
    handlers.add(handler as (payload: unknown) => void)
    this.listeners.set(eventName, handlers)
    return () => {
      handlers.delete(handler as (payload: unknown) => void)
    }
  }

  publish<K extends WorldwatchBusEventName>(eventName: K, payload: WorldwatchBusEvents[K]): void {
    for (const handler of this.listeners.get(eventName) ?? []) {
      handler(payload)
    }
  }
}

export class WorldwatchSelectionStore {
  private selected: WorldwatchSelectionDossier | null = null
  private readonly listeners = new Set<(selection: WorldwatchSelectionDossier | null) => void>()

  getSnapshot(): WorldwatchSelectionDossier | null {
    return this.selected
  }

  select(selection: WorldwatchSelectionDossier | null): void {
    this.selected = selection
    for (const listener of this.listeners) {
      listener(selection)
    }
  }

  subscribe(listener: (selection: WorldwatchSelectionDossier | null) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export type WorldwatchAgentCommand =
  | { type: 'select-entity'; dossier: WorldwatchSelectionDossier }
  | { type: 'clear-selection' }
  | { type: 'toggle-layer'; layerId: WorldwatchLayerId; active: boolean }
  | { type: 'focus-layer'; layerId: WorldwatchLayerId }

/*
 * Local-only control bridge. It does not open sockets, expose HTTP, or claim MCP.
 * Future agent tooling can adapt this class inside the running app boundary.
 */
export class WorldwatchAgentBus {
  private readonly dataBus: WorldwatchDataBus
  private readonly selectionStore: WorldwatchSelectionStore

  constructor(dataBus: WorldwatchDataBus, selectionStore: WorldwatchSelectionStore) {
    this.dataBus = dataBus
    this.selectionStore = selectionStore
  }

  dispatch(command: WorldwatchAgentCommand): void {
    if (command.type === 'select-entity') {
      this.selectionStore.select(command.dossier)
      this.dataBus.publish('select', command.dossier)
      return
    }
    if (command.type === 'clear-selection') {
      this.selectionStore.select(null)
      this.dataBus.publish('select', null)
      return
    }
    if (command.type === 'toggle-layer') {
      this.dataBus.publish('toggle-layer', { layerId: command.layerId, active: command.active })
      return
    }
    this.dataBus.publish('focus-layer', { layerId: command.layerId })
  }
}
