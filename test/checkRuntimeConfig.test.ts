import { describe, expect, it } from 'vitest'
import {
  buildRuntimeConfigReport,
  parseDotEnvText,
  supportedEnvNamesFromExample,
  validateOfficialUrl,
} from '../scripts/checkRuntimeConfig.mts'

describe('runtime config checker', () => {
  it('parses local env values without requiring them to be logged', () => {
    const env = parseDotEnvText(`
ATLASZ_FRED_API_KEY=secret
ATLASZ_SEC_USER_AGENT="Atlasz operator (ops@example.com)"
# ATLASZ_BEA_API_KEY=
`)
    expect(env.ATLASZ_FRED_API_KEY).toBe('secret')
    expect(env.ATLASZ_SEC_USER_AGENT).toBe('Atlasz operator (ops@example.com)')
    expect(env.ATLASZ_BEA_API_KEY).toBeUndefined()
  })

  it('discovers supported Atlasz env names from .env.example-style text', () => {
    expect(supportedEnvNamesFromExample('# ATLASZ_FRED_API_KEY=\nATLASZ_ENABLE_PUBLIC_WORLD=1')).toEqual([
      'ATLASZ_ENABLE_PUBLIC_WORLD',
      'ATLASZ_FRED_API_KEY',
    ])
  })

  it('accepts only official hosts for configured-only URLs', () => {
    expect(validateOfficialUrl('ATLASZ_UNLOCODE_URL', 'https://unece.org/trade.csv').valid).toBe(true)
    expect(validateOfficialUrl('ATLASZ_USGS_MRDS_URL', 'https://mrdata.usgs.gov/mrds/mrds.csv').valid).toBe(true)
    expect(validateOfficialUrl('ATLASZ_WPI_URL', 'https://msi.nga.mil/api/publications/download').valid).toBe(true)
    expect(validateOfficialUrl('ATLASZ_EIA_REFINERIES_URL', 'https://evil.example/refineries').valid).toBe(false)
    expect(validateOfficialUrl('ATLASZ_LNG_TERMINALS_URL', 'https://services7.arcgis.com/x/arcgis/rest/services/Lng_ImportExportTerminals_US_EIA/FeatureServer').valid).toBe(true)
  })

  it('reports locked connectors by env name only', () => {
    const report = buildRuntimeConfigReport(
      { ATLASZ_FRED_API_KEY: 'secret-fred' },
      '# ATLASZ_FRED_API_KEY=\n# ATLASZ_BEA_API_KEY=\n',
    )
    expect(report.activation.find((item) => item.envNames.includes('ATLASZ_FRED_API_KEY'))?.present).toBe(true)
    expect(JSON.stringify(report)).not.toContain('secret-fred')
    expect(report.lockedConnectors.some((row) => row.missing.includes('ATLASZ_BEA_API_KEY'))).toBe(true)
  })
})
