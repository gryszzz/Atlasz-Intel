/*
 * Politician / public-official financial disclosure adapter (Phase 2).
 *
 * Reads ONLY a configured public JSON / open-civic / public-disclosure
 * provider (ATLASZ_POLITICIAN_DISCLOSURE_URL). These are DELAYED public
 * disclosures — never implied to be real-time trading data or advice.
 *
 * Fail-closed: no provider configured -> adapter disabled, returns [].
 * Malformed payload -> []. Missing ticker -> event is KEPT (unmapped), never
 * dropped and never given an invented ticker.
 *
 * provenance: public-disclosure   category: public-disclosure
 */
import {
  adapterEventId,
  asEpochMs,
  asString,
  buildAdapterEvent,
  unique,
} from './adapterShared'
import type { WorldIntelEvent } from '../../../src/worldIntel'

export type PoliticianAdapterConfig = {
  url: string
  headers?: Record<string, string>
}

const SOURCE_ID = 'politician_disclosure_public'

export function readPoliticianConfig(env: NodeJS.ProcessEnv = process.env): PoliticianAdapterConfig | null {
  const url = asString(env.ATLASZ_POLITICIAN_DISCLOSURE_URL)
  if (!url || !/^https?:\/\//i.test(url)) {
    return null
  }
  let headers: Record<string, string> | undefined
  const rawHeaders = asString(env.ATLASZ_POLITICIAN_DISCLOSURE_HEADERS)
  if (rawHeaders) {
    try {
      const parsed = JSON.parse(rawHeaders) as Record<string, string>
      if (parsed && typeof parsed === 'object') {
        headers = parsed
      }
    } catch {
      // Ignore malformed header config; proceed with no extra headers.
    }
  }
  return { url, headers }
}

export async function fetchPoliticianDisclosures(
  signal: AbortSignal,
  config = readPoliticianConfig(),
): Promise<WorldIntelEvent[]> {
  if (!config) {
    // Fail closed: no configured public provider.
    return []
  }
  const response = await fetch(config.url, {
    signal,
    headers: { accept: 'application/json', ...(config.headers ?? {}) },
  })
  if (!response.ok) {
    throw new Error(`Politician disclosure HTTP ${response.status}`)
  }
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Politician disclosure provider returned non-JSON')
  }
  return normalizePoliticianDisclosures(payload)
}

/** Pure normalizer — testable with fixture/simulated payloads. */
export function normalizePoliticianDisclosures(payload: unknown): WorldIntelEvent[] {
  const records = extractRecords(payload)
  const events: WorldIntelEvent[] = []
  for (const record of records) {
    const event = normalizeOne(record)
    if (event) {
      events.push(event)
    }
  }
  return events
}

function normalizeOne(record: Record<string, unknown>): WorldIntelEvent | null {
  const name = firstString(record, ['representative', 'senator', 'politician', 'official', 'name', 'member'])
  if (!name) {
    return null
  }
  const office = firstString(record, ['office', 'chamber', 'district', 'state', 'party'])
  const ticker = normalizeTicker(firstString(record, ['ticker', 'symbol', 'asset_ticker', 'assetTicker']))
  const assetName = firstString(record, ['asset', 'asset_description', 'assetDescription', 'company', 'security', 'issuer'])
  const side = normalizeSide(firstString(record, ['type', 'transaction_type', 'transactionType', 'action', 'order_type']))
  const amount = firstString(record, ['amount', 'amount_range', 'amountRange', 'range', 'value'])
  const url = firstString(record, ['link', 'ptr_link', 'ptrLink', 'source', 'url', 'document_url'])
  const transactionDate = asEpochMs(firstRaw(record, ['transaction_date', 'transactionDate', 'tx_date', 'traded', 'date']))
  const disclosureDate = asEpochMs(firstRaw(record, ['disclosure_date', 'disclosureDate', 'filed', 'published', 'report_date']))
  const observedAt = disclosureDate ?? transactionDate ?? Date.now()

  const assetLabel = ticker || assetName || 'undisclosed asset'
  const title = `${name} — ${side} ${assetLabel}`
  const summaryParts = [
    `${office ? `${office}. ` : ''}Delayed public financial disclosure (not real-time trading).`,
    side !== 'unknown' ? `Transaction: ${side}.` : '',
    amount ? `Amount range: ${amount}.` : '',
    transactionDate ? `Transaction date: ${new Date(transactionDate).toISOString().slice(0, 10)}.` : '',
    disclosureDate ? `Disclosed: ${new Date(disclosureDate).toISOString().slice(0, 10)}.` : '',
    ticker ? '' : 'Ticker not provided by source; retained as unmapped disclosure.',
  ].filter((part) => part !== '')

  const dedupeKey = [name, ticker || assetName, transactionDate ?? '', side, amount].join('|').toLowerCase()

  return buildAdapterEvent({
    id: adapterEventId(SOURCE_ID, dedupeKey),
    title,
    summary: summaryParts.join(' '),
    source: 'Public official financial disclosure',
    url,
    observedAt,
    category: 'public-disclosure',
    provenance: 'public-disclosure',
    sourceId: SOURCE_ID,
    dedupeKey,
    rawPayload: record,
    affectedAssets: ticker ? [ticker] : [],
    narrativeTags: unique(['Public disclosure', 'Official financial disclosure', side === 'unknown' ? '' : `${side} disclosure`]),
    extractedEntities: unique([name, office, assetName]),
  })
}

function normalizeSide(value: string): 'purchase' | 'sale' | 'exchange' | 'unknown' {
  const normalized = value.toLowerCase()
  if (/(purchase|buy|acquire|bought)/.test(normalized)) return 'purchase'
  if (/(sale|sell|sold|dispos)/.test(normalized)) return 'sale'
  if (/exchange/.test(normalized)) return 'exchange'
  return 'unknown'
}

function normalizeTicker(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9.-]/g, '')
  return /^[A-Z]{1,6}([.-][A-Z]{1,4})?$/.test(cleaned) ? cleaned : ''
}

function extractRecords(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord)
  }
  if (isRecord(payload)) {
    for (const key of ['data', 'transactions', 'results', 'disclosures', 'items']) {
      const value = payload[key]
      if (Array.isArray(value)) {
        return value.filter(isRecord)
      }
    }
  }
  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstRaw(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return record[key]
    }
  }
  return undefined
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  return asString(firstRaw(record, keys))
}

export const POLITICIAN_SOURCE_ID = SOURCE_ID
