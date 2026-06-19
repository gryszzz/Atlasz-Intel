export type TwitterExploreKeyword = {
  keyword: string
  rank: number
  observedAt: number
  sourceTrust: 'public unauthenticated'
}

export type TwitterExploreScraperOptions = {
  enabled?: boolean
  authToken?: string
  headless?: boolean
}

/**
 * Structural placeholder for an opt-in Playwright/Puppeteer scraper.
 *
 * It is intentionally inert by default:
 * - no browser dependency is required for normal Atlasz startup
 * - no scraping occurs without ATLASZ_ENABLE_X_EXPLORE_SCRAPER=1
 * - no auth token is stored by Atlasz; callers must provide one through env
 *
 * A production implementation would launch a browser in a separate process,
 * inject an environment-supplied session token, visit public Explore/search
 * surfaces, and emit only aggregate keyword counts. It must never present this
 * as verified data and should respect rate limits and site terms.
 */
export class TwitterExploreScraper {
  private readonly enabled: boolean
  private readonly authToken?: string
  private readonly headless: boolean

  constructor(options: TwitterExploreScraperOptions = {}) {
    this.enabled = options.enabled ?? process.env.ATLASZ_ENABLE_X_EXPLORE_SCRAPER === '1'
    this.authToken = options.authToken ?? process.env.ATLASZ_X_AUTH_TOKEN
    this.headless = options.headless ?? true
  }

  async extractTrendingKeywords(): Promise<TwitterExploreKeyword[]> {
    if (!this.enabled) {
      return []
    }
    if (!this.authToken) {
      throw new Error('X Explore scraper requires ATLASZ_X_AUTH_TOKEN and is disabled by default.')
    }
    throw new Error(
      `X Explore scraper scaffold is configured (headless=${this.headless}) but no browser automation adapter is installed.`,
    )
  }
}
