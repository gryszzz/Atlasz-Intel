/*
 * Quant service (Phase 3) — Electron-main orchestrator that assembles the
 * QuantTerminalSnapshot the UI renders. It only reads already-persisted data
 * (market ticks, world events) and computes math-derived metrics; it never
 * fabricates bars or metrics. Macro fetch is fail-closed with a hard timeout.
 */
import type { IntelPersistence } from '../persistence'
import { QuantComputeService } from './quantComputeService'
import { computeMacroSnapshot, fetchMacroSeriesInputs } from './macroComputeService'
import { emptyMacroSnapshot, type MacroQuantSnapshot, type QuantTerminalSnapshot } from '../../src/quant'

const MAX_ASSETS = 16
const MACRO_TIMEOUT_MS = 8000
const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'BTC', 'AAPL', 'MSFT', 'NVDA']

export class QuantService {
  private readonly persistence: IntelPersistence
  private readonly compute: QuantComputeService

  constructor(persistence: IntelPersistence) {
    this.persistence = persistence
    this.compute = new QuantComputeService(persistence)
  }

  async snapshot(): Promise<QuantTerminalSnapshot> {
    const now = Date.now()
    const symbols = this.resolveSymbols()
    const events = this.persistence.listWorldIntelEvents(300)
    const assets = this.compute.computeSnapshots(symbols, { events, now })
    const macro = await this.macroSnapshot(now)
    return { generatedAt: now, assets, macro }
  }

  private resolveSymbols(): string[] {
    const universe = this.persistence.listAssetIdentities().map((asset) => asset.symbol.toUpperCase())
    const merged = [...new Set([...universe, ...DEFAULT_SYMBOLS])]
    return merged.slice(0, MAX_ASSETS)
  }

  private async macroSnapshot(now: number): Promise<MacroQuantSnapshot> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), MACRO_TIMEOUT_MS)
    try {
      const inputs = await fetchMacroSeriesInputs(controller.signal)
      if (!inputs) {
        return emptyMacroSnapshot('Macro series unavailable: configure ATLASZ_FRED_API_KEY (fail-closed).', now)
      }
      return computeMacroSnapshot(inputs, now)
    } catch (error) {
      return emptyMacroSnapshot(
        `Macro series fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        now,
      )
    } finally {
      clearTimeout(timer)
    }
  }
}
