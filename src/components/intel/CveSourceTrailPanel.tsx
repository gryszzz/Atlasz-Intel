/*
 * NVD CVE source-trail cards.
 *
 * Renders defensive vulnerability intelligence from normalized WorldIntelEvent
 * records that carry an `nvdCve` payload. Every card must earn the right to
 * render: a CVE is shown only when it has a CVE ID, official NVD URL, retrieval
 * timestamp, source identity, raw provenance hash, and high confidence. When no
 * record qualifies, the panel shows DATA_UNAVAILABLE instead of an empty shell.
 *
 * Exploitability is implied only when the CVE is in the CISA KEV catalog (KEV
 * badge) — never inferred from severity alone.
 */
import { Link2, ShieldAlert } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { selectRenderableNvdCves } from './cveTrailSelect'
import type { NvdCve, WorldIntelEvent } from '../../worldIntel'
import './CveSourceTrailPanel.css'

const CVE_UNAVAILABLE = 'DATA_UNAVAILABLE'

export function CveSourceTrailPanel({ events, limit = 6, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const cves = selectRenderableNvdCves(events, limit)
  return (
    <section className="cve-trail">
      <header className="cve-trail-head">
        <span>NVD CVE Intelligence</span>
        <strong>{cves.length > 0 ? `${cves.length} official` : CVE_UNAVAILABLE}</strong>
      </header>
      {cves.length > 0 ? (
        <div className="cve-trail-stack">
          {cves.map((cve) => (
            <CveCard key={cve.id} cve={cve} now={now} />
          ))}
        </div>
      ) : (
        <div className="cve-trail-empty">
          <strong>{CVE_UNAVAILABLE}</strong>
          <p>
            No NVD CVE records available. The public NIST NVD API returned no records, was rate-limited,
            or the connector is disabled. Nothing is fabricated.
          </p>
        </div>
      )}
    </section>
  )
}

function CveCard({ cve, now }: { cve: NvdCve; now: number }) {
  return (
    <article className="cve-row">
      <div className="cve-row-head">
        <strong>{cve.cveId}</strong>
        {cve.inKnownExploitedCatalog && (
          <span className="cve-kev-badge" title="Listed in the CISA Known Exploited Vulnerabilities catalog">
            <ShieldAlert size={11} /> CISA KEV
          </span>
        )}
        <ProvenanceBadge value={cve.provenance} size="sm" />
        <FreshnessBadge size="sm" now={now} retrievedAt={cve.retrievedAt} />
      </div>
      <p className="cve-desc">{cve.description || 'No English description provided by NVD.'}</p>
      <div className="cve-meta">
        {cve.cvss ? (
          <span className={`cve-severity sev-${cve.cvss.baseSeverity.toLowerCase()}`}>
            CVSS {cve.cvss.version} · {cve.cvss.baseScore} {cve.cvss.baseSeverity}
          </span>
        ) : (
          <span className="cve-severity sev-none">CVSS not assigned</span>
        )}
        <span>{cve.vulnStatus}</span>
        <span>{cve.confidence}% confidence</span>
      </div>
      <dl>
        <div>
          <dt>Source</dt>
          <dd>{cve.sourceName}</dd>
        </div>
        <div>
          <dt>Source ID</dt>
          <dd>{cve.sourceIdentifier}</dd>
        </div>
        <div>
          <dt>Published</dt>
          <dd>{cve.published.slice(0, 10)}</dd>
        </div>
        <div>
          <dt>Modified</dt>
          <dd>{cve.lastModified.slice(0, 10)}</dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>{formatAge(cve.retrievedAt)} ago</dd>
        </div>
        <div>
          <dt>Raw hash</dt>
          <dd>{cve.rawPayloadHash.slice(0, 12)}…</dd>
        </div>
      </dl>
      {cve.cweIds.length > 0 && (
        <div className="cve-cwe">
          {cve.cweIds.map((cwe) => (
            <span key={cwe}>{cwe}</span>
          ))}
        </div>
      )}
      {cve.vendorProducts.length > 0 && <small>Affected: {cve.vendorProducts.slice(0, 4).join(', ')}</small>}
      <a href={cve.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} />
        NVD source trail
      </a>
    </article>
  )
}

function formatAge(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }
  return `${Math.round(hours / 24)}d`
}
