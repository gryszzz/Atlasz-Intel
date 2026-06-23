import type { ProvenanceId } from './provenance'

export type IntelligenceDomainId =
  | 'financial-markets'
  | 'economic-data'
  | 'central-banks'
  | 'semiconductor-intelligence'
  | 'global-trade'
  | 'corporate-intelligence'
  | 'aviation-intelligence'
  | 'space-intelligence'
  | 'geospatial-intelligence'
  | 'energy-intelligence'
  | 'geopolitical-intelligence'
  | 'patent-intelligence'
  | 'ai-intelligence'
  | 'academic-research'
  | 'github-intelligence'
  | 'cryptocurrency-intelligence'
  | 'internet-infrastructure'
  | 'privacy-opsec'
  | 'defensive-detection'
  | 'network-intelligence'
  | 'internet-mapping'
  | 'malware-analysis'
  | 'engineering-architecture'
  | 'real-time-news-wires'
  | 'weather-natural-events'
  | 'osint-governance'
  | 'threat-intelligence'
  | 'agent-frameworks'

export type IntelligenceFeedType =
  | 'REST'
  | 'RSS'
  | 'HTML'
  | 'CSV'
  | 'JSON'
  | 'XML'
  | 'Atom'
  | 'Graph'
  | 'local'
  | 'manual-review'

export type IntelligenceAccessModel =
  | 'public-no-auth'
  | 'public-requires-key'
  | 'public-requires-user-agent'
  | 'auth-gated'
  | 'commercial-gated'
  | 'local-only'
  | 'authorized-scope-required'
  | 'reference-only'

export type IntelligenceIntegrationMode =
  | 'runtime-wired'
  | 'candidate-public-adapter'
  | 'auth-gated-adapter'
  | 'commercial-gated'
  | 'local-service'
  | 'authorized-lab-only'
  | 'reference-only'
  | 'blocked'

export type IntelligenceSource = {
  sourceId: string
  label: string
  domainId: IntelligenceDomainId
  category: string
  upstreamUrl: string
  feedTypes: IntelligenceFeedType[]
  accessModel: IntelligenceAccessModel
  integrationMode: IntelligenceIntegrationMode
  provenance: ProvenanceId
  envKeysRequired: string[]
  adapterHint: string
  keySignals: string[]
  legalSafetyNote: string
}

export type IntelligenceDomain = {
  id: IntelligenceDomainId
  label: string
  mission: string
  sourceIds: string[]
}

export const INTELLIGENCE_SOURCES: IntelligenceSource[] = [
  source('sec-edgar-company-filings', 'SEC EDGAR company filings', 'financial-markets', 'SEC / Filings', 'https://data.sec.gov/', ['REST', 'JSON'], 'public-requires-user-agent', 'candidate-public-adapter', 'official-api', ['ATLASZ_SEC_USER_AGENT'], 'sec-edgar', ['8-K shocks', '10-Q/10-K fundamentals', 'risk factors', 'insider/entity links'], 'Official SEC public data. Requires fair-access User-Agent and must preserve filing URLs.'),
  source('sec-edgar-search', 'SEC EDGAR search', 'financial-markets', 'SEC / Filings', 'https://www.sec.gov/edgar/search/', ['HTML'], 'public-no-auth', 'reference-only', 'official-api', [], 'manual-source-trail', ['company filing search', 'source trail verification'], 'Manual/source-trail reference; not a scraping target.'),

  source('crunchbase', 'Crunchbase', 'corporate-intelligence', 'Corporate Intelligence', 'https://www.crunchbase.com/', ['REST', 'HTML'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_CRUNCHBASE_API_KEY'], 'commercial-company-intel', ['funding rounds', 'investors', 'private-company graph', 'sector momentum'], 'Commercial source. No scraping or paywall bypass; adapter only with explicit API access and terms.'),
  source('opencorporates', 'OpenCorporates', 'corporate-intelligence', 'Corporate Intelligence', 'https://www.opencorporates.com/', ['REST', 'JSON', 'HTML'], 'public-requires-key', 'auth-gated-adapter', 'public-unauthenticated', ['ATLASZ_OPENCORPORATES_API_KEY'], 'company-registry-api', ['legal entities', 'jurisdictions', 'directors/officers where lawful', 'entity resolution'], 'Public/commercial registry boundary. Avoid personal enrichment defaults; preserve jurisdiction/source records.'),
  source('glassdoor', 'Glassdoor', 'corporate-intelligence', 'Corporate Intelligence', 'https://www.glassdoor.com/', ['HTML'], 'commercial-gated', 'reference-only', 'auth-gated', [], 'manual-source-trail', ['hiring sentiment', 'employee reviews', 'compensation anecdotes'], 'Reference-only. Do not scrape login/paywall content or treat anecdotal reviews as verified facts.'),
  source('linkedin', 'LinkedIn', 'corporate-intelligence', 'Corporate Intelligence', 'https://www.linkedin.com/', ['HTML'], 'auth-gated', 'blocked', 'auth-gated', [], 'blocked-identity-enrichment', ['hiring signals', 'company pages', 'professional graph'], 'Blocked from default Atlasz workflows. No profile scraping, login automation, or identity enrichment.'),

  source('fred-economic-data', 'FRED economic data', 'economic-data', 'Economic Data', 'https://fred.stlouisfed.org/docs/api/fred/', ['REST', 'JSON'], 'public-requires-key', 'auth-gated-adapter', 'official-api', ['ATLASZ_FRED_API_KEY'], 'fred-macro', ['rates', 'inflation', 'employment', 'credit', 'liquidity'], 'Official FRED API. Requires a user API key and fails closed without one.'),
  source('bls-public-data-api', 'BLS public data API', 'economic-data', 'Economic Data', 'https://www.bls.gov/developers/', ['REST', 'JSON'], 'public-no-auth', 'runtime-wired', 'official-api', [], 'bls-macro', ['CPI', 'PPI', 'employment', 'wages', 'productivity'], 'Official BLS public API; respect documented limits and revision behavior.'),
  source('bea-api', 'BEA API', 'economic-data', 'Economic Data', 'https://www.bea.gov/resources/for-developers', ['REST', 'JSON', 'CSV'], 'public-requires-key', 'auth-gated-adapter', 'official-api', ['ATLASZ_BEA_API_KEY'], 'bea-macro', ['GDP', 'income', 'industry output', 'trade', 'regional growth'], 'Official BEA API. Requires an API key and fails closed without one.'),
  source('treasury-fiscal-data', 'U.S. Treasury Fiscal Data', 'economic-data', 'Economic Data', 'https://fiscaldata.treasury.gov/api-documentation/', ['REST', 'JSON', 'CSV'], 'public-no-auth', 'runtime-wired', 'official-api', [], 'treasury-fiscal', ['debt issuance', 'cash balance', 'receipts', 'outlays', 'auction context'], 'Official Treasury API; public data is not a market prediction signal by itself.'),

  source('federal-reserve', 'Federal Reserve releases', 'central-banks', 'Central Banks', 'https://www.federalreserve.gov/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'central-bank-rss', ['FOMC', 'speeches', 'balance sheet', 'policy language'], 'Official public releases; parse source trail and timestamp exactly.'),
  source('european-central-bank', 'European Central Bank', 'central-banks', 'Central Banks', 'https://www.ecb.europa.eu/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'central-bank-rss', ['ECB decisions', 'speeches', 'euro liquidity', 'financial stability'], 'Official public releases; not verified beyond the issuing institution.'),
  source('bank-of-japan', 'Bank of Japan', 'central-banks', 'Central Banks', 'https://www.boj.or.jp/en/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'central-bank-rss', ['yield curve policy', 'yen liquidity', 'policy minutes'], 'Official public releases; Japan timezone handling must be explicit.'),
  source('bank-of-england', 'Bank of England', 'central-banks', 'Central Banks', 'https://www.bankofengland.co.uk/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'central-bank-rss', ['MPC', 'gilt/liquidity', 'financial stability', 'sterling policy'], 'Official public releases; preserve speech/notice URLs.'),

  source('tsmc-official', 'TSMC official releases', 'semiconductor-intelligence', 'Manufacturing', 'https://www.tsmc.com/english/news-events', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['capacity', 'node roadmaps', 'capex', 'fab geography'], 'Official company releases. Do not infer undisclosed capacity or customer exposure as verified.'),
  source('samsung-semiconductor-official', 'Samsung Semiconductor official releases', 'semiconductor-intelligence', 'Manufacturing', 'https://semiconductor.samsung.com/news-events/', ['HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['memory cycles', 'foundry roadmap', 'HBM', 'advanced packaging'], 'Official company releases; normalize as public official statements.'),
  source('intel-foundry-official', 'Intel Foundry official releases', 'semiconductor-intelligence', 'Manufacturing', 'https://www.intel.com/content/www/us/en/foundry/overview.html', ['HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['process roadmap', 'packaging', 'US/EU fabs', 'customer wins'], 'Official company releases; source trail required for each extracted event.'),
  source('asml-official', 'ASML official releases', 'semiconductor-intelligence', 'Equipment', 'https://www.asml.com/en/news', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['EUV/High-NA', 'order book', 'export controls', 'tool shipments'], 'Official company releases; export-control links remain local-derived unless backed by policy source.'),
  source('applied-materials-official', 'Applied Materials official releases', 'semiconductor-intelligence', 'Equipment', 'https://www.appliedmaterials.com/us/en/news.html', ['HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['deposition/etch demand', 'WFE cycle', 'AI infrastructure supply chain'], 'Official company releases; do not turn product language into forecasts.'),
  source('lam-research-official', 'Lam Research official releases', 'semiconductor-intelligence', 'Equipment', 'https://newsroom.lamresearch.com/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['etch/deposition', 'memory capex', 'advanced packaging'], 'Official company releases; preserve public timestamp and source URL.'),
  source('kla-official', 'KLA official releases', 'semiconductor-intelligence', 'Equipment', 'https://www.kla.com/newsroom', ['HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['process control', 'yield management', 'inspection demand'], 'Official company releases; source confidence is official statement, not outcome certainty.'),

  source('marinetraffic', 'MarineTraffic', 'global-trade', 'Shipping', 'https://www.marinetraffic.com/', ['REST', 'HTML'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_MARINETRAFFIC_API_KEY'], 'commercial-shipping', ['vessel movement', 'port congestion', 'shipping lanes'], 'Commercial source. Never scrape or bypass access controls; adapter only with explicit key/terms.'),
  source('port-of-los-angeles-stats', 'Port of Los Angeles statistics', 'global-trade', 'Shipping', 'https://www.portoflosangeles.org/business/statistics', ['HTML', 'CSV'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'port-statistics', ['TEUs', 'import/export flow', 'container trend'], 'Official public port statistics; lower-frequency macro context, not real-time vessel truth.'),
  source('un-comtrade', 'UN Comtrade', 'global-trade', 'Trade Data', 'https://comtradeplus.un.org/', ['REST', 'CSV'], 'public-requires-key', 'auth-gated-adapter', 'official-api', ['ATLASZ_UN_COMTRADE_API_KEY'], 'trade-statistics', ['commodity flows', 'country exposure', 'tariff-sensitive sectors'], 'Official UN trade data with access limits; fail closed without config.'),
  source('world-bank-data', 'World Bank Data API', 'global-trade', 'Trade Data', 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information', ['REST', 'JSON', 'CSV'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'world-bank-data', ['country indicators', 'growth', 'trade', 'energy intensity'], 'Official public data; normalize update frequency and missing values honestly.'),
  source('imf-data', 'IMF Data', 'global-trade', 'Trade Data', 'https://data.imf.org/', ['REST', 'CSV'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'imf-data', ['balance of payments', 'reserves', 'global macro', 'trade'], 'Official IMF data; adapter must handle dataset-specific schemas.'),

  source('adsb-exchange', 'ADS-B Exchange', 'aviation-intelligence', 'Aviation Intelligence', 'https://globe.adsbexchange.com/', ['REST', 'HTML', 'JSON'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_ADSB_EXCHANGE_API_KEY'], 'aviation-api', ['aircraft movement', 'cargo/defense flight context', 'airport disruption'], 'Commercial/API-gated aviation data. No scraping public viewers; adapter only with explicit API terms.'),
  source('flightradar24', 'Flightradar24', 'aviation-intelligence', 'Aviation Intelligence', 'https://www.flightradar24.com/', ['REST', 'HTML'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_FLIGHTRADAR24_API_KEY'], 'aviation-api', ['flight delays', 'route disruption', 'airline/airport context'], 'Commercial source. No bypass of app/API/paywall controls.'),
  source('flightaware', 'FlightAware', 'aviation-intelligence', 'Aviation Intelligence', 'https://www.flightaware.com/', ['REST', 'JSON'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_FLIGHTAWARE_API_KEY'], 'aviation-api', ['flight status', 'airport disruption', 'fleet movement'], 'Commercial/API-gated source. Runtime only with explicit credentials and terms.'),

  source('spacex-official', 'SpaceX official updates', 'space-intelligence', 'Launches', 'https://www.spacex.com/launches/', ['HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['launch cadence', 'Starlink', 'payload class'], 'Official public launch updates; no private telemetry.'),
  source('nasa-earthdata', 'NASA Earthdata', 'space-intelligence', 'Satellites / Earth Observation', 'https://www.earthdata.nasa.gov/', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'official-api', ['ATLASZ_NASA_EARTHDATA_TOKEN'], 'earth-observation', ['weather', 'fires', 'shipping weather', 'agriculture', 'infrastructure'], 'Official NASA data; some products require Earthdata auth and must fail closed without it.'),
  source('esa-official', 'ESA official releases', 'space-intelligence', 'Launches / Satellites', 'https://www.esa.int/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['launches', 'satellite missions', 'Earth observation'], 'Official ESA releases; use as public event context.'),
  source('celestrak-gp-data', 'CelesTrak GP/TLE data', 'space-intelligence', 'Satellites', 'https://celestrak.org/NORAD/documentation/gp-data-formats.php', ['REST', 'JSON', 'CSV'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'celestrak-satellite', ['satellite catalog', 'orbital elements', 'space infrastructure'], 'Public CelesTrak data; respect low-frequency polling guidance and temporary block risk.'),
  source('n2yo-satellites', 'N2YO satellite API', 'space-intelligence', 'Satellites', 'https://www.n2yo.com/api/', ['REST', 'JSON'], 'public-requires-key', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_N2YO_API_KEY'], 'satellite-api', ['satellite positions', 'passes', 'orbital context'], 'Requires API key; never invent satellite coverage when unavailable.'),

  source('openstreetmap', 'OpenStreetMap', 'geospatial-intelligence', 'Geospatial Intelligence', 'https://www.openstreetmap.org/', ['REST', 'JSON', 'HTML'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'geospatial-map-data', ['infrastructure context', 'ports/roads/rail', 'facility geocoding'], 'Public community map data. Respect usage policy and attribution; do not treat volunteered data as verified.'),
  source('nasa-earthdata-geospatial', 'NASA Earthdata geospatial products', 'geospatial-intelligence', 'Geospatial Intelligence', 'https://www.earthdata.nasa.gov/', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'official-api', ['ATLASZ_NASA_EARTHDATA_TOKEN'], 'earth-observation', ['fires', 'storms', 'vegetation', 'snow/ice', 'shipping weather'], 'Official NASA products; many datasets require Earthdata auth and product-specific terms.'),
  source('usgs-earth-explorer', 'USGS Earth Explorer', 'geospatial-intelligence', 'Geospatial Intelligence', 'https://earthexplorer.usgs.gov/', ['HTML', 'REST'], 'auth-gated', 'auth-gated-adapter', 'official-api', ['ATLASZ_USGS_API_KEY'], 'earth-observation', ['landsat imagery', 'surface change', 'natural events'], 'Official USGS data portal. Auth/API terms required for runtime ingestion.'),
  source('esa-sentinel', 'ESA Sentinel data', 'geospatial-intelligence', 'Geospatial Intelligence', 'https://sentinel.esa.int/', ['HTML', 'REST'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'earth-observation', ['Copernicus/Sentinel imagery', 'SAR context', 'infrastructure monitoring'], 'Official Sentinel program source; adapters must use documented access routes and attribution.'),
  source('planet', 'Planet', 'geospatial-intelligence', 'Geospatial Intelligence', 'https://www.planet.com/', ['REST', 'JSON'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_PLANET_API_KEY'], 'commercial-earth-observation', ['daily imagery', 'facility monitoring', 'agriculture/shipping context'], 'Commercial Earth observation source. No scraping; adapter only with explicit API access.'),
  source('google-earth-engine', 'Google Earth Engine', 'geospatial-intelligence', 'Geospatial Intelligence', 'https://developers.google.com/earth-engine', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_EARTH_ENGINE_CREDENTIALS'], 'earth-engine', ['geospatial computation', 'imagery composites', 'environmental indicators'], 'Auth-gated computation platform. Runtime only with explicit configured credentials and quotas.'),

  source('eia-api', 'U.S. EIA API', 'energy-intelligence', 'Grid & Power', 'https://www.eia.gov/opendata/', ['REST', 'JSON'], 'public-requires-key', 'auth-gated-adapter', 'official-api', ['ATLASZ_EIA_API_KEY'], 'energy-statistics', ['oil/gas inventories', 'power generation', 'fuel prices', 'grid mix'], 'Official EIA data; fail closed without API key.'),
  source('iea-data', 'International Energy Agency data', 'energy-intelligence', 'Grid & Power', 'https://www.iea.org/data-and-statistics', ['HTML', 'CSV'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'energy-statistics', ['energy balances', 'demand', 'transition minerals', 'power mix'], 'Official IEA data; licensing and dataset terms must be checked per dataset.'),
  source('iaea-official', 'IAEA official releases', 'energy-intelligence', 'Nuclear', 'https://www.iaea.org/newscenter', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'official-release-feed', ['nuclear safety', 'uranium context', 'geopolitical nuclear events'], 'Official IAEA releases; event context only, not verification of market impact.'),

  source('white-house-briefings', 'White House briefings', 'geopolitical-intelligence', 'Government Sources', 'https://www.whitehouse.gov/briefing-room/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'government-release-feed', ['executive policy', 'sanctions', 'tariffs', 'AI policy'], 'Official government releases; quote/source trail required.'),
  source('congress-gov', 'Congress.gov', 'geopolitical-intelligence', 'Government Sources', 'https://www.congress.gov/', ['REST', 'JSON', 'HTML'], 'public-requires-key', 'auth-gated-adapter', 'official-api', ['ATLASZ_CONGRESS_API_KEY'], 'government-legislation-api', ['bills', 'committee actions', 'policy momentum', 'sector regulation'], 'Official legislative source. Requires configured API key for runtime and exact bill/source trails.'),
  source('federal-register', 'Federal Register API', 'geopolitical-intelligence', 'Government Sources', 'https://www.federalregister.gov/reader-aids/developer-resources/rest-api', ['REST', 'JSON'], 'public-no-auth', 'runtime-wired', 'official-api', [], 'federal-register', ['rules', 'proposed rules', 'notices', 'agency actions', 'public comment windows'], 'Official FederalRegister.gov API. Regulatory document metadata only; preserve Federal Register URLs and govinfo PDFs when present. No invented legal impact or ticker exposure.'),
  source('ofac-sdn', 'Treasury OFAC SDN list', 'geopolitical-intelligence', 'Government Sources', 'https://ofac.treasury.gov/sanctions-list-service', ['REST', 'XML'], 'public-no-auth', 'runtime-wired', 'official-api', [], 'ofac-sdn', ['sanctions records', 'program tags', 'listed countries', 'stable OFAC UIDs'], 'Official OFAC Sanctions List Service export. List evidence only; no screening, fuzzy matching, inferred guilt/risk labels, person enrichment, or ticker exposure.'),
  source('us-state-department', 'U.S. State Department', 'geopolitical-intelligence', 'Government Sources', 'https://www.state.gov/press-releases/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'government-release-feed', ['sanctions', 'travel advisories', 'diplomacy', 'conflict context'], 'Official public releases; separate policy statement from inferred asset exposure.'),
  source('nato-official', 'NATO official releases', 'geopolitical-intelligence', 'Government Sources', 'https://www.nato.int/cps/en/natohq/news.htm', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'government-release-feed', ['defense posture', 'alliance movement', 'security risk'], 'Official NATO releases; use as event evidence, not prediction.'),
  source('un-official', 'United Nations official releases', 'geopolitical-intelligence', 'Government Sources', 'https://news.un.org/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'government-release-feed', ['sanctions', 'humanitarian risk', 'conflict', 'trade policy'], 'Official UN news; preserve source URLs and topic tags.'),
  source('cia-world-factbook', 'CIA World Factbook', 'geopolitical-intelligence', 'Government Sources', 'https://www.cia.gov/the-world-factbook/', ['HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'country-reference-data', ['country baseline', 'resources', 'population', 'geography', 'government'], 'Official public reference source. Baseline context only; updates are not real-time signals.'),

  source('reuters', 'Reuters', 'real-time-news-wires', 'Real-Time News Wires', 'https://www.reuters.com/', ['HTML', 'RSS'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_REUTERS_API_KEY'], 'licensed-news-wire', ['breaking business news', 'geopolitics', 'markets', 'source trails'], 'Commercial/licensed news boundary. Do not scrape or redistribute paywalled/licensed content.'),
  source('associated-press', 'Associated Press', 'real-time-news-wires', 'Real-Time News Wires', 'https://www.apnews.com/', ['HTML', 'RSS'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_AP_API_KEY'], 'licensed-news-wire', ['breaking news', 'government', 'weather/disaster', 'global events'], 'Licensed/newswire boundary. Runtime only through allowed feeds/API terms.'),
  source('bloomberg', 'Bloomberg', 'real-time-news-wires', 'Real-Time News Wires', 'https://www.bloomberg.com/', ['HTML'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_BLOOMBERG_API_KEY'], 'licensed-news-wire', ['markets', 'macro', 'company news', 'policy'], 'Commercial/paywalled source. No scraping or terminal substitution.'),
  source('financial-times', 'Financial Times', 'real-time-news-wires', 'Real-Time News Wires', 'https://www.ft.com/', ['HTML', 'RSS'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_FT_API_KEY'], 'licensed-news-wire', ['macro analysis', 'companies', 'markets', 'geopolitics'], 'Commercial/paywalled source. Use only licensed/allowed feeds.'),
  source('wall-street-journal', 'Wall Street Journal', 'real-time-news-wires', 'Real-Time News Wires', 'https://www.wsj.com/', ['HTML'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_WSJ_API_KEY'], 'licensed-news-wire', ['business news', 'markets', 'company events'], 'Commercial/paywalled source. No scraping, bypassing, or content mirroring.'),

  source('weather-gov', 'National Weather Service / weather.gov', 'weather-natural-events', 'Weather & Natural Events', 'https://www.weather.gov/', ['REST', 'JSON', 'HTML'], 'public-no-auth', 'runtime-wired', 'official-api', [], 'noaa-alerts', ['weather alerts', 'storms', 'hazards', 'regional disruption'], 'Official U.S. weather source. Alerts are public safety context, not market predictions.'),
  source('usgs-earthquake', 'USGS Earthquake Hazards Program', 'weather-natural-events', 'Weather & Natural Events', 'https://earthquake.usgs.gov/', ['REST', 'JSON'], 'public-no-auth', 'runtime-wired', 'official-api', [], 'usgs-quakes', ['earthquakes', 'aftershocks', 'infrastructure risk', 'regional impact'], 'Official USGS hazard data; preserve magnitude/time/location uncertainty.'),
  source('national-hurricane-center', 'National Hurricane Center', 'weather-natural-events', 'Weather & Natural Events', 'https://www.nhc.noaa.gov/', ['HTML', 'RSS'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'weather-alert-feed', ['hurricanes', 'storm tracks', 'port/energy risk', 'evacuation context'], 'Official NHC source. Forecast cones are uncertainty products; labels must preserve uncertainty.'),
  source('noaa', 'NOAA', 'weather-natural-events', 'Weather & Natural Events', 'https://www.noaa.gov/', ['REST', 'JSON', 'HTML'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'weather-climate-api', ['weather', 'climate', 'ocean', 'natural hazards'], 'Official NOAA source; adapters must use documented public endpoints and metadata.'),

  source('google-patents', 'Google Patents', 'patent-intelligence', 'Patent Intelligence', 'https://patents.google.com/', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['patent search', 'prior art', 'assignee trend'], 'Useful manual search surface; no official default scraping adapter.'),
  source('uspto-apis', 'USPTO APIs', 'patent-intelligence', 'Patent Intelligence', 'https://developer.uspto.gov/api-catalog', ['REST', 'JSON'], 'public-no-auth', 'candidate-public-adapter', 'official-api', [], 'patent-api', ['assignee activity', 'classification trend', 'inventor networks'], 'Official USPTO API catalog; adapters must use documented endpoints only.'),
  source('wipo-patentscope', 'WIPO PATENTSCOPE', 'patent-intelligence', 'Patent Intelligence', 'https://patentscope.wipo.int/', ['HTML', 'REST'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_WIPO_PATENTSCOPE_KEY'], 'patent-api', ['international patent families', 'PCT filings', 'technology trend'], 'Auth/terms-gated. Do not scrape or bypass PATENTSCOPE controls.'),

  source('arxiv-api', 'arXiv API', 'ai-intelligence', 'Research', 'https://info.arxiv.org/help/api/user-manual.html', ['REST', 'Atom'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'research-paper-feed', ['AI papers', 'semiconductor research', 'quant finance', 'robotics'], 'Public arXiv API; must follow attribution and API usage terms.'),
  source('huggingface-papers', 'Hugging Face Papers', 'ai-intelligence', 'Research', 'https://huggingface.co/papers', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['AI research attention', 'model/paper trend'], 'Public web surface; no default scraper. Prefer official Hub APIs where possible.'),
  source('huggingface-hub-api', 'Hugging Face Hub API', 'ai-intelligence', 'Models', 'https://huggingface.co/docs/hub/en/api', ['REST', 'JSON'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'model-registry-api', ['model releases', 'dataset releases', 'download attention', 'AI infrastructure trend'], 'Public endpoints exist, but gated/private repos require tokens and must fail closed.'),
  source('ollama-local', 'Ollama local models', 'ai-intelligence', 'Models', 'http://localhost:11434', ['local'], 'local-only', 'local-service', 'local-model', ['ATLASZ_ENABLE_OLLAMA'], 'local-model', ['local parser', 'embeddings', 'summaries'], 'Local optional service. Outputs are local-model/model-inferred, never verified.'),
  source('papers-with-code', 'Papers with Code', 'ai-intelligence', 'Research', 'https://paperswithcode.com/', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['benchmark attention', 'task/model linkage', 'research implementation trend'], 'Reference-only unless a documented API route is added; benchmark popularity is not model quality.'),

  source('google-scholar', 'Google Scholar', 'academic-research', 'Academic & Research', 'https://scholar.google.com/', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['citation trails', 'academic search', 'research provenance'], 'Reference-only. Do not scrape automated Scholar results or bypass anti-bot controls.'),
  source('semantic-scholar', 'Semantic Scholar', 'academic-research', 'Academic & Research', 'https://www.semanticscholar.org/', ['REST', 'JSON', 'HTML'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'research-paper-api', ['citation graph', 'paper metadata', 'author/institution links'], 'Public research metadata; adapter must honor API policy and citation/source trails.'),
  source('researchgate', 'ResearchGate', 'academic-research', 'Academic & Research', 'https://www.researchgate.net/', ['HTML'], 'auth-gated', 'reference-only', 'auth-gated', [], 'manual-source-trail', ['researcher pages', 'publication links', 'academic context'], 'Reference-only. No login automation, profile scraping, or private document collection.'),

  source('github-rest-search', 'GitHub REST search API', 'github-intelligence', 'GitHub Intelligence', 'https://docs.github.com/en/rest/search/search', ['REST', 'JSON'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'github-search', ['repo velocity', 'security advisories', 'AI infra projects', 'developer attention'], 'Public API has rate limits; auth improves limits but must be explicit. Stars are attention, not reliability.'),
  source('github-trending', 'GitHub Trending', 'github-intelligence', 'GitHub Intelligence', 'https://github.com/trending', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['developer attention', 'emerging repos'], 'Reference-only web surface; no default scraping adapter.'),
  source('github-explore', 'GitHub Explore', 'github-intelligence', 'GitHub Intelligence', 'https://github.com/explore', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['topic discovery', 'project taxonomy'], 'Reference-only web surface; use documented APIs for runtime ingestion.'),
  source('github-topics', 'GitHub Topics', 'github-intelligence', 'GitHub Intelligence', 'https://github.com/topics', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['topic clusters', 'developer ecosystem taxonomy'], 'Reference-only web surface; runtime ingestion should prefer documented GitHub APIs.'),
  source('github-marketplace', 'GitHub Marketplace', 'github-intelligence', 'GitHub Intelligence', 'https://github.com/marketplace', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['developer tooling demand', 'CI/security tooling', 'AI developer products'], 'Reference-only. Marketplace listings are commercial attention signals, not verified adoption.'),

  source('coingecko', 'CoinGecko', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://www.coingecko.com/', ['REST', 'JSON'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'crypto-market-api', ['crypto prices', 'market caps', 'volume', 'asset metadata'], 'Public unauthenticated crypto data; not an exchange of record or verified price oracle.'),
  source('coinmarketcap', 'CoinMarketCap', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://coinmarketcap.com/', ['REST', 'JSON'], 'public-requires-key', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_COINMARKETCAP_API_KEY'], 'crypto-market-api', ['market cap', 'rankings', 'metadata', 'category attention'], 'Requires API key for clean runtime integration; no scraping public pages.'),
  source('defillama', 'DefiLlama', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://defillama.com/', ['REST', 'JSON'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'defi-data-api', ['TVL', 'chain flow', 'protocol categories', 'stablecoin context'], 'Public DeFi data; labels must remain public-unauthenticated/local-derived.'),
  source('dune', 'Dune', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://dune.com/', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_DUNE_API_KEY'], 'onchain-query-api', ['query results', 'on-chain dashboards', 'protocol analytics'], 'Auth-gated query platform. Only run configured queries; never claim dashboard data is verified.'),
  source('glassnode', 'Glassnode', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://glassnode.com/', ['REST', 'JSON'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_GLASSNODE_API_KEY'], 'commercial-onchain-api', ['on-chain metrics', 'exchange flows', 'supply cohorts'], 'Commercial on-chain analytics; adapter only with explicit API access.'),
  source('cryptoquant', 'CryptoQuant', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://cryptoquant.com/', ['REST', 'JSON'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_CRYPTOQUANT_API_KEY'], 'commercial-onchain-api', ['exchange flows', 'miner flows', 'derivatives context'], 'Commercial on-chain analytics; no scraping or account automation.'),
  source('messari', 'Messari', 'cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'https://messari.io/', ['REST', 'JSON'], 'commercial-gated', 'commercial-gated', 'auth-gated', ['ATLASZ_MESSARI_API_KEY'], 'commercial-crypto-research', ['asset profiles', 'research notes', 'sector taxonomy'], 'Commercial research/data boundary. Runtime only with API/terms and provenance labels.'),

  source('bgp-he', 'Hurricane Electric BGP Toolkit', 'internet-infrastructure', 'Internet Infrastructure', 'https://bgp.he.net/', ['HTML'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'manual-source-trail', ['ASN lookup', 'prefix context', 'network ownership'], 'Reference-only web surface. Avoid automated scraping; use documented APIs where available.'),
  source('cloudflare-radar', 'Cloudflare Radar', 'internet-infrastructure', 'Internet Infrastructure', 'https://radar.cloudflare.com/', ['REST', 'JSON', 'HTML'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'internet-radar-api', ['traffic anomalies', 'internet outages', 'bot/trend context'], 'Public internet telemetry; treat as provider perspective, not global truth.'),
  source('shodan', 'Shodan', 'internet-infrastructure', 'Internet Infrastructure', 'https://www.shodan.io/', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_SHODAN_API_KEY'], 'internet-exposure-api', ['internet-exposed services', 'industrial exposure', 'asset fingerprints'], 'Auth-gated exposure data. No scanning or target enrichment without explicit authorization.'),
  source('censys', 'Censys Search', 'internet-infrastructure', 'Internet Infrastructure', 'https://search.censys.io/', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_CENSYS_API_ID', 'ATLASZ_CENSYS_API_SECRET'], 'internet-exposure-api', ['certificates', 'hosts', 'services', 'attack-surface context'], 'Auth-gated exposure data. Future use must be scoped and audited.'),
  source('urlscan', 'urlscan.io', 'internet-infrastructure', 'Internet Infrastructure', 'https://urlscan.io/', ['REST', 'JSON'], 'public-requires-key', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_URLSCAN_API_KEY'], 'url-analysis-api', ['URL evidence', 'web artifacts', 'phishing/infrastructure context'], 'Submission/search behavior can expose sensitive URLs; require explicit key and OPSEC guardrails.'),
  source('virustotal', 'VirusTotal', 'internet-infrastructure', 'Internet Infrastructure', 'https://www.virustotal.com/', ['REST', 'JSON'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_VIRUSTOTAL_API_KEY'], 'malware-intel-api', ['file/URL reputation', 'domain relations', 'malware context'], 'Auth-gated CTI source. Avoid uploading sensitive files/URLs; preserve OPSEC and terms.'),

  source('awesome-osint', 'Awesome OSINT', 'osint-governance', 'Core OSINT Lists', 'https://github.com/jivoi/awesome-osint', ['manual-review'], 'reference-only', 'reference-only', 'local-derived', [], 'osint-governance', ['tool taxonomy', 'coverage gaps'], 'Reference catalog only. Do not auto-install or auto-run listed tools.'),
  source('openosint', 'OpenOSINT', 'osint-governance', 'Core OSINT Lists', 'https://github.com/OpenOSINT/OpenOSINT', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'osint-governance', ['agent interface pattern', 'tool boundary design'], 'Reference-only unless future operator-authorized workflows are added.'),
  source('osint-framework', 'OSINT Framework', 'osint-governance', 'Core OSINT Lists', 'https://github.com/lockfale/OSINT-Framework', ['manual-review'], 'reference-only', 'reference-only', 'local-derived', [], 'osint-governance', ['taxonomy', 'manual source triage'], 'Reference-only catalog; every candidate still needs adapter review.'),
  source('spiderfoot', 'SpiderFoot', 'osint-governance', 'OSINT Tools', 'https://github.com/smicallef/spiderfoot', ['manual-review'], 'reference-only', 'reference-only', 'auth-gated', [], 'osint-governance', ['module registry design', 'authorized recon concepts'], 'Recon framework. Not auto-wired; requires explicit authorized scope in any future mode.'),
  source('theharvester', 'theHarvester', 'osint-governance', 'OSINT Tools', 'https://github.com/laramies/theHarvester', ['manual-review'], 'reference-only', 'reference-only', 'auth-gated', [], 'osint-governance', ['authorized domain exposure research'], 'No email/person harvesting by default. Reference-only.'),
  source('maryam', 'Maryam', 'osint-governance', 'OSINT Tools', 'https://github.com/saeeddhqan/Maryam', ['manual-review'], 'reference-only', 'reference-only', 'auth-gated', [], 'osint-governance', ['modular OSINT design'], 'Reference-only; do not execute unreviewed third-party modules.'),
  source('photon', 'Photon', 'osint-governance', 'OSINT Tools', 'https://github.com/s0md3v/Photon', ['manual-review'], 'reference-only', 'reference-only', 'auth-gated', [], 'osint-governance', ['crawler boundary design'], 'Crawler. Not a default Atlasz source. No unbounded crawling.'),
  source('holehe', 'Holehe', 'osint-governance', 'OSINT Tools', 'https://github.com/megadose/holehe', ['manual-review'], 'reference-only', 'blocked', 'auth-gated', [], 'blocked-identity-enrichment', ['identity-enrichment boundary'], 'Identity/account enumeration is blocked from default Atlasz workflows.'),
  source('toutatis', 'Toutatis', 'osint-governance', 'OSINT Tools', 'https://github.com/megadose/toutatis', ['manual-review'], 'reference-only', 'blocked', 'auth-gated', [], 'blocked-identity-enrichment', ['identity-enrichment boundary'], 'Instagram/person enrichment is blocked from default Atlasz workflows.'),

  source('opencti', 'OpenCTI', 'threat-intelligence', 'Threat Intelligence Platforms', 'https://github.com/OpenCTI-Platform/opencti', ['Graph', 'REST'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_OPENCTI_ENDPOINT', 'ATLASZ_OPENCTI_TOKEN'], 'threat-intel-graph', ['STIX entities', 'campaigns', 'threat actors', 'CVE context'], 'Future configured platform adapter only. External CTI is not verified by default.'),
  source('misp', 'MISP', 'threat-intelligence', 'Threat Intelligence Platforms', 'https://github.com/MISP/MISP', ['REST', 'Graph'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_MISP_ENDPOINT', 'ATLASZ_MISP_API_KEY'], 'threat-intel-platform', ['indicators', 'malware events', 'sharing communities'], 'Future configured platform adapter only; requires operator-owned endpoint/key.'),
  source('yeti', 'Yeti', 'threat-intelligence', 'Threat Intelligence Platforms', 'https://github.com/yeti-platform/yeti', ['REST', 'Graph'], 'auth-gated', 'auth-gated-adapter', 'auth-gated', ['ATLASZ_YETI_ENDPOINT', 'ATLASZ_YETI_API_KEY'], 'threat-intel-platform', ['observables', 'entities', 'campaign context'], 'Future configured platform adapter only; keep CTI provenance separate from verified facts.'),
  source('malwarebazaar-client', 'MalwareBazaar Client', 'threat-intelligence', 'Threat Intelligence Sources', 'https://github.com/Neo23x0/MalwareBazaar-Client', ['REST', 'JSON', 'manual-review'], 'public-no-auth', 'reference-only', 'public-unauthenticated', [], 'malware-intel-reference', ['malware hashes', 'sample metadata', 'family names'], 'Reference-only by default. Do not download malware samples or submit sensitive observables from Atlasz.'),
  source('elastic-detection-rules', 'Elastic detection rules', 'threat-intelligence', 'Threat Intelligence Sources', 'https://github.com/elastic/detection-rules', ['JSON', 'manual-review'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'detection-rule-catalog', ['detection logic', 'technique mapping', 'rule metadata'], 'Public rule repository. Useful for defensive context, not proof of compromise.'),
  source('mitre-cti', 'MITRE CTI', 'threat-intelligence', 'Threat Intelligence Sources', 'https://github.com/mitre/cti', ['JSON', 'Graph'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'stix-cti-catalog', ['STIX objects', 'attack patterns', 'campaign/software relations'], 'Public CTI repository. Preserve STIX object provenance and versioning.'),
  source('mitre-attack', 'MITRE ATT&CK', 'threat-intelligence', 'Threat Intelligence Sources', 'https://attack.mitre.org/', ['HTML', 'JSON'], 'public-no-auth', 'candidate-public-adapter', 'public-unauthenticated', [], 'attack-technique-catalog', ['techniques', 'tactics', 'mitigations', 'procedure examples'], 'Public knowledge base. Defensive context only; do not turn technique pages into operational guidance.'),

  source('langgraph', 'LangGraph', 'agent-frameworks', 'Agent Frameworks', 'https://github.com/langchain-ai/langgraph', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'agent-architecture-reference', ['stateful agent workflows', 'tool policy design'], 'Reference architecture only. Future agents must use Atlasz-approved tools and audit logs.'),
  source('crewai', 'CrewAI', 'agent-frameworks', 'Agent Frameworks', 'https://github.com/crewAIInc/crewAI', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'agent-architecture-reference', ['role separation', 'research workflow roles'], 'Reference architecture only; no unrestricted autonomous tools.'),
  source('ag2', 'AG2', 'agent-frameworks', 'Agent Frameworks', 'https://github.com/ag2ai/ag2', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'agent-architecture-reference', ['multi-agent coordination', 'review loops'], 'Reference architecture only; no autonomous source expansion.'),
  source('openhands', 'OpenHands', 'agent-frameworks', 'Agent Frameworks', 'https://github.com/All-Hands-AI/OpenHands', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'agent-architecture-reference', ['software agent execution boundary'], 'Reference-only for engineering automation patterns, not OSINT runtime.'),
  source('agent-laboratory', 'Agent Laboratory', 'agent-frameworks', 'Agent Frameworks', 'https://github.com/SamuelSchmidgall/AgentLaboratory', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'agent-architecture-reference', ['research workflow planning', 'experiment logs'], 'Reference-only; scientific-agent output remains local-model/model-inferred.'),
  source('agno', 'Agno', 'agent-frameworks', 'Agent Frameworks', 'https://github.com/agno-agi/agno', ['manual-review'], 'reference-only', 'reference-only', 'local-model', [], 'agent-architecture-reference', ['assistant memory', 'tool-use design'], 'Reference-only until Atlasz has explicit agent tool policy.'),
  source('awesome-ai-agents-e2b', 'Awesome AI Agents', 'agent-frameworks', 'Agent Lists', 'https://github.com/e2b-dev/awesome-ai-agents', ['manual-review'], 'reference-only', 'reference-only', 'local-derived', [], 'agent-architecture-reference', ['agent landscape review'], 'Reference catalog only. Popularity is not reliability.'),
  source('awesome-agents-kyrolabs', 'Awesome Agents', 'agent-frameworks', 'Agent Lists', 'https://github.com/kyrolabs/awesome-agents', ['manual-review'], 'reference-only', 'reference-only', 'local-derived', [], 'agent-architecture-reference', ['agent landscape review'], 'Reference catalog only. Do not auto-install tools from lists.'),
]

export const INTELLIGENCE_DOMAINS: IntelligenceDomain[] = [
  domain('financial-markets', 'Financial Markets', 'Filings, market structure, company disclosures, and regulated source trails.'),
  domain('economic-data', 'Economic Data', 'Macro time series, labor, GDP, fiscal data, and cross-cycle context.'),
  domain('central-banks', 'Central Banks', 'Policy language, liquidity context, decisions, speeches, and stability reports.'),
  domain('semiconductor-intelligence', 'Semiconductor Intelligence', 'Manufacturing, foundry, equipment, packaging, memory, and AI infrastructure bottlenecks.'),
  domain('global-trade', 'Global Trade', 'Shipping, ports, trade flows, country exposure, and commodity movement context.'),
  domain('corporate-intelligence', 'Corporate Intelligence', 'Company registries, funding, hiring, and public corporate source trails.'),
  domain('aviation-intelligence', 'Aviation Intelligence', 'Flight, airport, cargo, and aerospace movement context through authorized/public boundaries.'),
  domain('space-intelligence', 'Space Intelligence', 'Launches, satellites, Earth observation, and space infrastructure.'),
  domain('geospatial-intelligence', 'Geospatial Intelligence', 'Maps, imagery, Earth observation, and spatial context for physical-world signals.'),
  domain('energy-intelligence', 'Energy Intelligence', 'Grid, power, fuel, inventories, nuclear, and energy-transition signals.'),
  domain('geopolitical-intelligence', 'Geopolitical Intelligence', 'Government releases, sanctions, defense posture, diplomacy, and policy shocks.'),
  domain('patent-intelligence', 'Patent Intelligence', 'Patent filings, assignee trends, technology emergence, and prior-art trails.'),
  domain('ai-intelligence', 'AI Intelligence', 'Research, model releases, local models, and open-source AI attention.'),
  domain('academic-research', 'Academic & Research', 'Scholarly metadata, citation graphs, and research-source trails.'),
  domain('github-intelligence', 'GitHub Intelligence', 'Developer attention, repo velocity, security advisories, and emerging toolchains.'),
  domain('cryptocurrency-intelligence', 'Cryptocurrency Intelligence', 'Crypto market, DeFi, on-chain, and protocol attention sources with clear trust labels.'),
  domain('internet-infrastructure', 'Internet Infrastructure', 'BGP, internet telemetry, exposure search, URL/file reputation, and outage context.'),
  domain('real-time-news-wires', 'Real-Time News Wires', 'Licensed and public newswire surfaces with strict source/terms boundaries.'),
  domain('weather-natural-events', 'Weather & Natural Events', 'Official weather, earthquake, hurricane, ocean, and climate event sources.'),
  domain('osint-governance', 'OSINT Governance', 'OSINT catalogs and tools mapped into safe reference/auth-gated boundaries.'),
  domain('threat-intelligence', 'Threat Intelligence', 'Configured CTI platforms and threat graphs, never verified by default.'),
  domain('agent-frameworks', 'Agent Frameworks', 'Agent architecture references for future bounded workflows.'),
]

const sourceById = new Map(INTELLIGENCE_SOURCES.map((item) => [item.sourceId, item]))

export function lookupIntelligenceSource(sourceId: string): IntelligenceSource | undefined {
  return sourceById.get(sourceId)
}

export function sourcesForDomain(domainId: IntelligenceDomainId): IntelligenceSource[] {
  return INTELLIGENCE_SOURCES.filter((sourceItem) => sourceItem.domainId === domainId)
}

export function sourceIsRuntimeEligible(sourceItem: IntelligenceSource): boolean {
  return (
    sourceItem.integrationMode === 'runtime-wired' ||
    sourceItem.integrationMode === 'candidate-public-adapter' ||
    sourceItem.integrationMode === 'auth-gated-adapter' ||
    sourceItem.integrationMode === 'local-service'
  )
}

export function sourceCanAutoWireWithoutCredentials(sourceItem: IntelligenceSource): boolean {
  return (
    sourceItem.integrationMode === 'runtime-wired' ||
    (sourceItem.integrationMode === 'candidate-public-adapter' &&
      sourceItem.accessModel === 'public-no-auth' &&
      sourceItem.envKeysRequired.length === 0)
  )
}

export function summarizeIntelligenceCatalog() {
  const byDomain = new Map<IntelligenceDomainId, number>()
  const byMode = new Map<IntelligenceIntegrationMode, number>()
  for (const sourceItem of INTELLIGENCE_SOURCES) {
    byDomain.set(sourceItem.domainId, (byDomain.get(sourceItem.domainId) ?? 0) + 1)
    byMode.set(sourceItem.integrationMode, (byMode.get(sourceItem.integrationMode) ?? 0) + 1)
  }
  return {
    domainCount: INTELLIGENCE_DOMAINS.length,
    sourceCount: INTELLIGENCE_SOURCES.length,
    runtimeEligibleCount: INTELLIGENCE_SOURCES.filter(sourceIsRuntimeEligible).length,
    credentiallessAutoWireCount: INTELLIGENCE_SOURCES.filter(sourceCanAutoWireWithoutCredentials).length,
    byDomain: Object.fromEntries(byDomain),
    byMode: Object.fromEntries(byMode),
  }
}

function source(
  sourceId: string,
  label: string,
  domainId: IntelligenceDomainId,
  category: string,
  upstreamUrl: string,
  feedTypes: IntelligenceFeedType[],
  accessModel: IntelligenceAccessModel,
  integrationMode: IntelligenceIntegrationMode,
  provenance: ProvenanceId,
  envKeysRequired: string[],
  adapterHint: string,
  keySignals: string[],
  legalSafetyNote: string,
): IntelligenceSource {
  return {
    sourceId,
    label,
    domainId,
    category,
    upstreamUrl,
    feedTypes,
    accessModel,
    integrationMode,
    provenance,
    envKeysRequired,
    adapterHint,
    keySignals,
    legalSafetyNote,
  }
}

function domain(id: IntelligenceDomainId, label: string, mission: string): IntelligenceDomain {
  return {
    id,
    label,
    mission,
    sourceIds: INTELLIGENCE_SOURCES.filter((sourceItem) => sourceItem.domainId === id).map((sourceItem) => sourceItem.sourceId),
  }
}
