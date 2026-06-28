/*
 * Local runtime configuration checker.
 *
 * Reads .env locally, prints key/config presence only, validates official hosts
 * for configured-only URLs, and lists locked connectors. Never prints secret
 * values or full URL query strings.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONNECTOR_AUDIT_DEFINITIONS } from '../src/engine/runtimeAudit'

export type RuntimeConfigItem = {
  envNames: string[]
  label: string
  unlocks: string
  kind: 'public-free-key' | 'key-gated' | 'contact-user-agent' | 'configured-url' | 'optional-politeness' | 'allowlist'
  signupUrl: string
  expectedBefore: string
  expectedAfter: string
  required: boolean
}

export type UrlValidation = {
  envName: string
  configured: boolean
  valid: boolean
  host?: string
  allowed: string
  detail: string
}

export type RuntimeConfigReport = {
  supportedEnvNames: string[]
  activation: Array<RuntimeConfigItem & { present: boolean; missing: string[] }>
  urls: UrlValidation[]
  lockedConnectors: Array<{ label: string; missing: string[] }>
  invalidUrls: UrlValidation[]
}

const ENV_EXAMPLE = '.env.example'
const LOCAL_ENV = '.env'

export const RUNTIME_CONFIG_ITEMS: RuntimeConfigItem[] = [
  {
    envNames: ['ATLASZ_SEC_USER_AGENT'],
    label: 'SEC contact User-Agent',
    unlocks: 'SEC EDGAR, Company Facts, Form 4, Form 13F',
    kind: 'contact-user-agent',
    signupUrl: 'https://www.sec.gov/os/accessing-edgar-data',
    expectedBefore: 'missing-key / fail-closed',
    expectedAfter: 'online or honest SEC failure',
    required: true,
  },
  {
    envNames: ['ATLASZ_FRED_API_KEY'],
    label: 'FRED API key',
    unlocks: 'FRED macro series',
    kind: 'public-free-key',
    signupUrl: 'https://fred.stlouisfed.org/docs/api/api_key.html',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_BEA_API_KEY'],
    label: 'BEA UserID',
    unlocks: 'BEA national accounts',
    kind: 'public-free-key',
    signupUrl: 'https://apps.bea.gov/API/signup/',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_EIA_API_KEY'],
    label: 'EIA API key',
    unlocks: 'EIA energy, power plants, nuclear, grid/BAs',
    kind: 'public-free-key',
    signupUrl: 'https://www.eia.gov/opendata/register.php',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_PATENTSVIEW_API_KEY'],
    label: 'PatentsView API key',
    unlocks: 'USPTO patents',
    kind: 'public-free-key',
    signupUrl: 'https://patentsview.org/apis',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_OPENALEX_API_KEY'],
    label: 'OpenAlex API key',
    unlocks: 'OpenAlex research metadata',
    kind: 'public-free-key',
    signupUrl: 'https://openalex.org',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_CONGRESS_API_KEY'],
    label: 'Congress.gov API key',
    unlocks: 'Congress.gov bill actions',
    kind: 'public-free-key',
    signupUrl: 'https://api.congress.gov/sign-up/',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_UN_COMTRADE_API_KEY'],
    label: 'UN Comtrade subscription key',
    unlocks: 'UN Comtrade trade flows',
    kind: 'key-gated',
    signupUrl: 'https://comtradeplus.un.org/',
    expectedBefore: 'missing-key',
    expectedAfter: 'online or rate-limited/failed',
    required: true,
  },
  {
    envNames: ['ATLASZ_ALPACA_API_KEY', 'ATLASZ_ALPACA_SECRET_KEY'],
    label: 'Alpaca market data keys',
    unlocks: 'Equity/ETF quotes',
    kind: 'key-gated',
    signupUrl: 'https://alpaca.markets/data',
    expectedBefore: 'PRICE_UNAVAILABLE / missing-key',
    expectedAfter: 'online or auth/rate-limited failure',
    required: true,
  },
  {
    envNames: ['ATLASZ_OPTIONS_UNDERLYINGS'],
    label: 'Options underlyings allowlist',
    unlocks: 'Options chain/open interest scope',
    kind: 'allowlist',
    signupUrl: 'https://alpaca.markets/options',
    expectedBefore: 'deferred or missing allowlist',
    expectedAfter: 'configured scope; no flow inference',
    required: true,
  },
  {
    envNames: ['ATLASZ_CROSSREF_MAILTO'],
    label: 'Crossref polite pool mailto',
    unlocks: 'Crossref polite request pool',
    kind: 'optional-politeness',
    signupUrl: 'https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/',
    expectedBefore: 'public pool',
    expectedAfter: 'polite pool; mailto stripped from source trails',
    required: false,
  },
  {
    envNames: ['ATLASZ_LNG_TERMINALS_URL'],
    label: 'Official LNG terminal endpoint',
    unlocks: 'LNG terminal facility layer',
    kind: 'configured-url',
    signupUrl: 'https://atlas.eia.gov/datasets/liquefied-natural-gas-lng-import-and-export-terminals',
    expectedBefore: 'missing-key / configured-only URL missing',
    expectedAfter: 'online or honest endpoint failure',
    required: true,
  },
  {
    envNames: ['ATLASZ_UNLOCODE_URL'],
    label: 'Official UNECE UN/LOCODE CSV',
    unlocks: 'UN/LOCODE port/location registry',
    kind: 'configured-url',
    signupUrl: 'https://unece.org/trade/cefact/UNLOCODE-Download',
    expectedBefore: 'missing-key / configured-only URL missing',
    expectedAfter: 'online or honest endpoint failure',
    required: true,
  },
  {
    envNames: ['ATLASZ_USGS_USMIN_URL', 'ATLASZ_USGS_MRDS_URL'],
    label: 'Official USGS mineral exports',
    unlocks: 'USGS USMIN/MRDS mineral sites',
    kind: 'configured-url',
    signupUrl: 'https://mrdata.usgs.gov/',
    expectedBefore: 'missing-key / configured-only URL missing',
    expectedAfter: 'online or honest endpoint failure',
    required: true,
  },
  {
    envNames: ['ATLASZ_WPI_URL'],
    label: 'World Port Index override',
    unlocks: 'NGA World Port Index if default changes/fails',
    kind: 'configured-url',
    signupUrl: 'https://msi.nga.mil/Publications/WPI',
    expectedBefore: 'default NGA URL used',
    expectedAfter: 'override host validated to nga.mil',
    required: false,
  },
  {
    envNames: ['ATLASZ_EIA_REFINERIES_URL'],
    label: 'EIA refinery source URL',
    unlocks: 'EIA refineries from a pinned official source',
    kind: 'configured-url',
    signupUrl: 'https://atlas.eia.gov/datasets/petroleum-refineries',
    expectedBefore: 'missing-key / configured-only URL missing',
    expectedAfter: 'online or honest endpoint failure',
    required: false,
  },
]

export function parseDotEnvText(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue
    out[match[1]] = stripQuotes(match[2].trim())
  }
  return out
}

export function supportedEnvNamesFromExample(text: string): string[] {
  const names = new Set<string>()
  for (const match of text.matchAll(/#?\s*(ATLASZ_[A-Z0-9_]+)\s*=/g)) names.add(match[1])
  return [...names].sort()
}

export function loadRuntimeEnv(cwd = process.cwd()): Record<string, string> {
  const localPath = join(cwd, LOCAL_ENV)
  const local = existsSync(localPath) ? parseDotEnvText(readFileSync(localPath, 'utf8')) : {}
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
  return { ...local, ...inherited }
}

export function buildRuntimeConfigReport(env: Record<string, string>, envExampleText: string): RuntimeConfigReport {
  const activation = RUNTIME_CONFIG_ITEMS.map((item) => {
    const missing = item.envNames.filter((envName) => !hasValue(env[envName]))
    return { ...item, present: missing.length === 0, missing }
  })
  const urls = RUNTIME_CONFIG_ITEMS
    .filter((item) => item.kind === 'configured-url')
    .flatMap((item) => item.envNames.map((envName) => validateOfficialUrl(envName, env[envName])))
  const lockedConnectors = CONNECTOR_AUDIT_DEFINITIONS
    .filter((definition) => definition.requiredEnv.length > 0)
    .map((definition) => ({
      label: definition.label,
      missing: definition.requiredEnv.filter((envName) => !hasValue(env[envName])),
    }))
    .filter((row) => row.missing.length > 0)

  return {
    supportedEnvNames: supportedEnvNamesFromExample(envExampleText),
    activation,
    urls,
    lockedConnectors,
    invalidUrls: urls.filter((url) => url.configured && !url.valid),
  }
}

export function validateOfficialUrl(envName: string, rawValue: string | undefined): UrlValidation {
  const value = rawValue?.trim()
  const allowed = allowedHosts(envName)
  if (!value) {
    return { envName, configured: false, valid: false, allowed, detail: 'missing' }
  }
  try {
    const url = new URL(value)
    const valid = url.protocol === 'https:' && officialHostOk(envName, url)
    return {
      envName,
      configured: true,
      valid,
      host: url.hostname,
      allowed,
      detail: valid ? 'official host accepted' : 'not an accepted official host/path',
    }
  } catch {
    return { envName, configured: true, valid: false, allowed, detail: 'invalid URL' }
  }
}

function officialHostOk(envName: string, url: URL): boolean {
  switch (envName) {
    case 'ATLASZ_LNG_TERMINALS_URL':
      return (
        hostEndsWith(url.hostname, 'eia.gov') ||
        hostEndsWith(url.hostname, 'ferc.gov') ||
        hostEndsWith(url.hostname, 'energy.gov') ||
        (hostEndsWith(url.hostname, 'arcgis.com') && /Lng_ImportExportTerminals/i.test(url.pathname))
      )
    case 'ATLASZ_UNLOCODE_URL':
      return hostEndsWith(url.hostname, 'unece.org')
    case 'ATLASZ_USGS_USMIN_URL':
    case 'ATLASZ_USGS_MRDS_URL':
      return hostEndsWith(url.hostname, 'usgs.gov')
    case 'ATLASZ_WPI_URL':
      return hostEndsWith(url.hostname, 'nga.mil')
    case 'ATLASZ_EIA_REFINERIES_URL':
      return hostEndsWith(url.hostname, 'eia.gov') || (hostEndsWith(url.hostname, 'arcgis.com') && /refiner/i.test(url.pathname))
    default:
      return false
  }
}

function allowedHosts(envName: string): string {
  switch (envName) {
    case 'ATLASZ_LNG_TERMINALS_URL':
      return 'eia.gov, ferc.gov, energy.gov, or confirmed EIA ArcGIS LNG service'
    case 'ATLASZ_UNLOCODE_URL':
      return 'unece.org'
    case 'ATLASZ_USGS_USMIN_URL':
    case 'ATLASZ_USGS_MRDS_URL':
      return 'usgs.gov'
    case 'ATLASZ_WPI_URL':
      return 'nga.mil'
    case 'ATLASZ_EIA_REFINERIES_URL':
      return 'eia.gov or ArcGIS refinery FeatureServer'
    default:
      return 'n/a'
  }
}

function printReport(report: RuntimeConfigReport) {
  console.log('\n=== Atlasz Runtime Config Check ===\n')
  console.log('Secrets: values are not printed. Output is env-name + present yes/no only.\n')
  console.log(`Supported env vars in ${ENV_EXAMPLE}: ${report.supportedEnvNames.length}`)
  console.log(`Local ${LOCAL_ENV}: ${existsSync(join(process.cwd(), LOCAL_ENV)) ? 'present' : 'missing'}\n`)

  console.log('Activation items:')
  for (const item of report.activation) {
    const envList = item.envNames.join(', ')
    console.log(`  [${item.present ? 'yes' : 'no '}] ${envList}`)
    console.log(`       unlocks: ${item.unlocks}`)
    console.log(`       type: ${item.kind} | before: ${item.expectedBefore} | after: ${item.expectedAfter}`)
  }

  console.log('\nConfigured official URL validation:')
  for (const url of report.urls) {
    const state = !url.configured ? 'missing' : url.valid ? 'valid' : 'invalid'
    const host = url.host ? ` host=${url.host}` : ''
    console.log(`  [${state}] ${url.envName}${host} | allowed: ${url.allowed}`)
  }

  console.log('\nLocked connectors:')
  if (report.lockedConnectors.length === 0) {
    console.log('  none')
  } else {
    for (const row of report.lockedConnectors) {
      console.log(`  - ${row.label}: missing ${row.missing.join(', ')}`)
    }
  }

  if (report.invalidUrls.length > 0) {
    console.log('\nInvalid configured URLs:')
    for (const row of report.invalidUrls) console.log(`  - ${row.envName}: ${row.detail}; allowed ${row.allowed}`)
  }
}

function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hostEndsWith(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`)
}

function stripQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function isMain(): boolean {
  return process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false
}

if (isMain()) {
  const envExamplePath = join(process.cwd(), ENV_EXAMPLE)
  const envExampleText = existsSync(envExamplePath) ? readFileSync(envExamplePath, 'utf8') : ''
  const report = buildRuntimeConfigReport(loadRuntimeEnv(), envExampleText)
  printReport(report)
  process.exitCode = report.invalidUrls.length > 0 ? 1 : 0
}
